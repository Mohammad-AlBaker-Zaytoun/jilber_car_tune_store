/**
 * Minimal in-memory fixed-window rate limiter.
 *
 * Good enough for a single Node instance (the current deployment model). For
 * multi-instance / serverless, swap the Map for a shared store (Upstash Redis,
 * Vercel KV) keyed the same way.
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

/** Returns the client IP from proxy headers, falling back to "unknown". */
export function getClientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]!.trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
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
