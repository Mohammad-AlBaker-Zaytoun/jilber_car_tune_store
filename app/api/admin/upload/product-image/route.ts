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

const UPLOAD_DIR =
  process.env.UPLOAD_DIR ?? join(process.cwd(), 'public', 'products', 'uploads');
const UPLOAD_PUBLIC_PATH = (process.env.UPLOAD_PUBLIC_PATH ?? '/products/uploads').replace(
  /\/$/,
  ''
);

export async function POST(request: Request) {
  try {
    await requireAdmin();

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

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File exceeds 5 MB limit.' }, { status: 400 });
    }

    const originalExt = extname(file.name).toLowerCase();
    const ext = MIME_TO_EXT[file.type] ?? originalExt;

    // Filename derived entirely from server-generated randomness — no user input
    const unique = randomBytes(8).toString('hex');
    const safeName = `product-${unique}${ext}`;

    await mkdir(UPLOAD_DIR, { recursive: true });

    const bytes = await file.arrayBuffer();
    await writeFile(join(UPLOAD_DIR, safeName), Buffer.from(bytes));

    return NextResponse.json({ path: `${UPLOAD_PUBLIC_PATH}/${safeName}` });
  } catch (err) {
    return handleAdminError(err);
  }
}
