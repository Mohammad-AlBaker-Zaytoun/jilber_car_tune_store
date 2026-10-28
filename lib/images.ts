/**
 * Whether an image path points at an admin-uploaded product photo.
 *
 * WHY THIS EXISTS
 * Uploaded images are written to UPLOAD_DIR — deliberately OUTSIDE the Next
 * build output, so a redeploy cannot wipe them — and are served by nginx under
 * UPLOAD_PUBLIC_PATH (see deploy/nginx.conf and the upload route).
 *
 * next/image optimises a same-origin path by fetching it back from the APP's
 * own origin. The app has no route for /products/uploads/*, only nginx does, so
 * the optimizer received a 404, logged "The requested resource isn't a valid
 * image ... received null", and answered 400. Every uploaded product photo was
 * a broken image on the storefront, in the cart and in the admin table — while
 * the file itself served perfectly on its direct URL.
 *
 * Marking these `unoptimized` makes Next emit the plain path, which nginx
 * serves straight from disk with its own 30-day cache header. Product photos
 * are already modestly sized; the optimizer's resizing is the only thing given
 * up, and a broken image is worse than an unresized one.
 *
 * If UPLOAD_PUBLIC_PATH is ever changed from the default, set
 * NEXT_PUBLIC_UPLOAD_PUBLIC_PATH to match so the client can recognise it too.
 */
const UPLOAD_PREFIX = (
  process.env.NEXT_PUBLIC_UPLOAD_PUBLIC_PATH ?? '/products/uploads'
).replace(/\/$/, '');

export function isUploadedImage(src?: string | null): boolean {
  return typeof src === 'string' && src.startsWith(`${UPLOAD_PREFIX}/`);
}
