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

  const expectedHost = request.nextUrl.host;

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
