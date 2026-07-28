import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join, extname } from 'path';
import { randomBytes } from 'crypto';
import { requireAdmin, handleAdminError } from '@/lib/admin';

// Storage location is configurable so production (VPS) can write to a PERSISTENT
// directory outside the build output — a redeploy that replaces the app dir would
// otherwise wipe uploads under public/. Set:
//   UPLOAD_DIR         absolute fs path, e.g. /var/lib/jilber/uploads
//   UPLOAD_PUBLIC_PATH URL prefix the reverse proxy serves that dir from
// When unset, falls back to public/products/uploads (fine for local dev).
//
// Serverless note: on a read-only FS (e.g. Vercel) this handler can't write —
// swap for S3/Cloudinary/Blob there. The VPS local-disk path is supported.

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/avif': '.avif',
};

/**
 * Identifies an image from its magic bytes, independent of what the client
 * claimed. Returns null for anything not in the allowlist (notably SVG, which is
 * scriptable and is excluded on purpose).
 */
export function sniffImageType(bytes: Uint8Array): string | null {
  const startsWith = (...sig: number[]) =>
    sig.length <= bytes.length && sig.every((b, i) => bytes[i] === b);

  // FF D8 FF
  if (startsWith(0xff, 0xd8, 0xff)) return 'image/jpeg';
  // \x89 P N G \r \n \x1a \n
  if (startsWith(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return 'image/png';

  // RIFF....WEBP — bytes 0-3 "RIFF", bytes 8-11 "WEBP"
  const ascii = (offset: number, text: string) =>
    offset + text.length <= bytes.length &&
    [...text].every((c, i) => bytes[offset + i] === c.charCodeAt(0));
  if (ascii(0, 'RIFF') && ascii(8, 'WEBP')) return 'image/webp';

  // ISO-BMFF: ....ftyp{avif|avis}
  if (ascii(4, 'ftyp') && (ascii(8, 'avif') || ascii(8, 'avis'))) return 'image/avif';

  return null;
}

const UPLOAD_DIR =
  process.env.UPLOAD_DIR ?? join(process.cwd(), 'public', 'products', 'uploads');
const UPLOAD_PUBLIC_PATH = (process.env.UPLOAD_PUBLIC_PATH ?? '/products/uploads').replace(
  /\/$/,
  ''
);

export async function POST(request: Request) {
  try {
    await requireAdmin();

    // Reject oversized bodies BEFORE parsing. request.formData() buffers the
    // entire payload into memory, so checking file.size afterwards meant a
    // multi-GB POST was fully read first — a memory DoS, admin-only but trivial.
    // Allow some slack over MAX_SIZE for multipart boundaries and other fields.
    const declaredLength = Number(request.headers.get('content-length') ?? 0);
    if (declaredLength > MAX_SIZE + 64 * 1024) {
      return NextResponse.json(
        { error: 'File exceeds 5 MB limit.' },
        { status: 413 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: 'File type not allowed. Use JPEG, PNG, WebP, or AVIF.' },
        { status: 400 }
      );
    }

    // Belt and braces: Content-Length can be absent (chunked encoding) or lie.
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File exceeds 5 MB limit.' }, { status: 413 });
    }

    const bytes = await file.arrayBuffer();

    // The declared MIME type comes from the client's multipart headers and is
    // what picks the stored extension. Verify it against the actual file
    // signature so a mislabelled (or deliberately disguised) payload cannot be
    // written with an image extension.
    const sniffed = sniffImageType(new Uint8Array(bytes));
    if (!sniffed || sniffed !== file.type) {
      return NextResponse.json(
        { error: 'File contents do not match its type. Use a real JPEG, PNG, WebP, or AVIF.' },
        { status: 400 }
      );
    }

    const originalExt = extname(file.name).toLowerCase();
    const ext = MIME_TO_EXT[file.type] ?? originalExt;

    // Filename derived entirely from server-generated randomness — no user input
    const unique = randomBytes(8).toString('hex');
    const safeName = `product-${unique}${ext}`;

    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(join(UPLOAD_DIR, safeName), Buffer.from(bytes));

    return NextResponse.json({ path: `${UPLOAD_PUBLIC_PATH}/${safeName}` });
  } catch (err) {
    return handleAdminError(err);
  }
}
