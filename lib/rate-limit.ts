/**
 * Minimal in-memory fixed-window rate limiter.
 *
 * Good enough for a single Node instance (the current deployment model — PM2
 * fork mode with instances: 1, see deploy/ecosystem.config.js). That constraint
 * is load-bearing: running two workers doubles every effective limit. For
 * multi-instance, swap the Map for a shared store (Redis) keyed the same way.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  ok: boolean;
  /** Seconds until the window resets (only meaningful when `ok` is false). */
  retryAfter: number;
}

/**
 * How many reverse proxies sit between the public internet and this process.
 *
 * Default 1 = the nginx in deploy/nginx.conf. Set TRUSTED_PROXY_COUNT=0 when the
 * app is exposed directly (no proxy), or higher when behind e.g. Cloudflare +
 * nginx. Getting this wrong in the *high* direction lets clients spoof their IP;
 * too low just means everyone shares the proxy's bucket.
 */
function trustedProxyCount(): number {
  const raw = process.env.TRUSTED_PROXY_COUNT;
  if (raw === undefined) return 1;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : 1;
}

const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/;
const IPV6 = /^[0-9a-f:]+$/i;

function looksLikeIp(value: string): boolean {
  return IPV4.test(value) || (value.includes(':') && IPV6.test(value));
}

/**
 * Returns the client IP, resolved so that a client cannot choose its own value.
 *
 * X-Forwarded-For is a client-writable header. Reading `xff.split(',')[0]` — the
 * LEFTMOST entry — takes whatever the caller sent, so an attacker could rotate a
 * fake IP per request and defeat every limit here (login, register, password
 * reset, orders, contact). That was the bug.
 *
 * Each proxy APPENDS the address it received the connection from, so the entry
 * contributed by our own outermost trusted proxy is the Nth from the RIGHT. That
 * value is written by infrastructure we control and cannot be forged by the
 * client. Counting from the right is also correct when nginx is configured to
 * overwrite rather than append (the single-entry case).
 *
 *   client sends:  X-Forwarded-For: 9.9.9.9        (a lie)
 *   nginx appends: X-Forwarded-For: 9.9.9.9, 203.0.113.5
 *                                            ^ real, trusted, what we use
 */
export function getClientIp(req: Request): string {
  const proxies = trustedProxyCount();

  // No proxy in front: forwarding headers are pure client input — ignore them.
  // (Direct-connection peer address is not exposed to route handlers, so all
  // such traffic shares one bucket. Deploy behind the provided nginx conf.)
  if (proxies === 0) return 'direct';

  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    const parts = xff
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length > 0) {
      // Nth from the right, clamped: a client can lengthen this list but only by
      // prepending, which pushes its own entries further left, never into this slot.
      const index = Math.max(0, parts.length - proxies);
      const candidate = parts[index]!;
      if (looksLikeIp(candidate)) return candidate;
    }
  }

  // X-Real-IP is set (and overwritten) by our nginx conf.
  const realIp = req.headers.get('x-real-ip')?.trim();
  if (realIp && looksLikeIp(realIp)) return realIp;

  return 'unknown';
}

/**
 * Records a hit for `key` and reports whether it's within `limit` per `windowMs`.
 * Prunes expired buckets opportunistically to bound memory.
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();

  if (buckets.size > 5000) {
    for (const [k, b] of buckets) if (now > b.resetAt) buckets.delete(k);
  }

  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  if (bucket.count >= limit) {
    return { ok: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  bucket.count += 1;
  return { ok: true, retryAfter: 0 };
}

/** Builds a 429 JSON Response with a Retry-After header. */
export function tooManyRequests(retryAfter: number): Response {
  return Response.json(
    { error: 'Too many requests. Please try again later.' },
    { status: 429, headers: { 'Retry-After': String(retryAfter) } }
  );
}
