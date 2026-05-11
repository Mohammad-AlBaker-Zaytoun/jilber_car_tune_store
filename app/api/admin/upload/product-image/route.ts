import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join, extname } from 'path';
import { randomBytes } from 'crypto';
import { requireAdmin, handleAdminError } from '@/lib/admin';

// NOTE: Writing to public/ is acceptable for local development only.
// In production (Vercel/serverless) the filesystem is read-only after build.
// Replace this handler with S3, Cloudinary, UploadThing, or Supabase Storage
// before deploying to a serverless platform.

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/avif': '.avif',
};

const UPLOAD_DIR = join(process.cwd(), 'public', 'products', 'uploads');

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

    return NextResponse.json({ path: `/products/uploads/${safeName}` });
  } catch (err) {
    return handleAdminError(err);
  }
}
