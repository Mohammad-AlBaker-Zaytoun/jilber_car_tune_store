/**
 * CSRF defense for state-changing requests.
 *
 * The session cookie is already `sameSite=lax`, which blocks most cross-site
 * POST/PUT/PATCH/DELETE. This adds a second, explicit layer: verify that the
 * request's `Origin` (or, as a fallback, `Referer`) is same-origin with the
 * deployment host. No client changes are required — browsers attach `Origin`
 * automatically on non-GET requests.
 *
 * This is the OWASP-recommended "verify origin" pattern and is lighter than a
 * synchronizer/double-submit token for a same-origin fetch-based client.
 */
import type { NextRequest } from 'next/server';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Returns true when the request is safe to process (read-only method, or a
 * state-changing request whose Origin/Referer matches the host). Returns false
 * only for state-changing requests with a mismatched or missing origin.
 */
export function isSameOriginRequest(request: NextRequest): boolean {
  if (SAFE_METHODS.has(request.method)) return true;

  // Compare against the forwarded/Host header, NOT request.nextUrl.host.
  //
  // Behind a reverse proxy, nextUrl.host is the address the Node server is
  // BOUND to — "localhost:3000" — not the host the browser asked for. It
  // therefore never equals a real Origin, so in production every mutating
  // request (register, order, quote, contact, login) returned 403 while the
  // Playwright suite passed, because Playwright talks to localhost:3000 and
  // the two coincidentally matched.
  //
  // This mirrors what Next.js itself does for Server Actions: compare Origin
  // against Host / X-Forwarded-Host (see node_modules/next/dist/docs/01-app/
  // 02-guides/data-security.md).
  //
  // Trusting these headers is safe in this deployment: the app binds to
  // 127.0.0.1 only, nginx OVERWRITES both headers with $host, and its
  // server_name match means a request with a foreign Host never reaches this
  // server block at all. If the app is ever exposed directly, this assumption
  // must be revisited.
  const expectedHost =
    request.headers.get('x-forwarded-host') ??
    request.headers.get('host') ??
    request.nextUrl.host;

  const origin = request.headers.get('origin');
  if (origin) {
    try {
      return new URL(origin).host === expectedHost;
    } catch {
      return false;
    }
  }

  // Some user agents omit Origin on same-origin requests — fall back to Referer.
  const referer = request.headers.get('referer');
  if (referer) {
    try {
      return new URL(referer).host === expectedHost;
    } catch {
      return false;
    }
  }

  // A state-changing request with neither header is treated as untrusted.
  return false;
}
