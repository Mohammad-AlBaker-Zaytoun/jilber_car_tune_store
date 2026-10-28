/**
 * Signed, short-lived "this submission came from a real page load" tokens.
 *
 * WHY THIS EXISTS
 * The contact form already had a honeypot, and it caught nothing: between 18
 * and 29 August 1,013 machine-generated inquiries were stored. The messages
 * were random alphanumeric strings with no links and no marketing copy, which
 * is the signature of a bot POSTing straight to /api/contact with the fields the
 * schema requires. A honeypot only works on something that reads the form, and
 * these never did.
 *
 * A token the server signed is the part a direct poster cannot fabricate. To
 * submit, a client must first fetch one and then wait: bots that fire a single
 * request at the endpoint are refused outright, and a bot willing to fetch,
 * parse and pause is a far smaller population than one running a URL list.
 *
 * Deliberately stateless — signed with AUTH_SECRET via `jose`, mirroring
 * lib/auth.ts and lib/payments/pay-token.ts, so there is no new table to
 * migrate or prune. Consequences:
 *
 *   - Rotating AUTH_SECRET invalidates outstanding form tokens. The client
 *     handles that by fetching a fresh one and retrying once.
 *   - Tokens are NOT single-use. Making them so would need server state, and
 *     the goal here is to raise the cost of automated submission, not to build
 *     a nonce. Replay is bounded by MAX_AGE_MS and the per-IP rate limit.
 */

import { SignJWT, jwtVerify } from 'jose';

/** Distinguishes these from session and pay tokens signed with the same secret. */
const PURPOSE = 'form-submit';

/**
 * A human cannot read the form, type a name, an email and a message, and submit
 * inside three seconds. A script can do it in milliseconds.
 */
export const MIN_AGE_MS = 3_000;

/**
 * How long a fetched token stays usable. Long enough that someone who opens the
 * page, takes a phone call and comes back still succeeds; short enough that a
 * harvested token is not worth stockpiling.
 */
export const MAX_AGE_MS = 6 * 60 * 60 * 1000;

export type FormTokenFailure = 'missing' | 'invalid' | 'too-fast' | 'expired';

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET environment variable is not set');
  if (secret.length < 32) throw new Error('AUTH_SECRET must be at least 32 characters');
  return new TextEncoder().encode(secret);
}

/** Mints a token stamped with the moment the form was served. */
export async function createFormToken(now: number = Date.now()): Promise<string> {
  return new SignJWT({ purpose: PURPOSE, issued: now })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .sign(getSecret());
}

/**
 * Verifies a form token. Returns null when acceptable, or why it was refused.
 *
 * The `purpose` check is what stops a session cookie or a pay link — signed
 * with the same secret — being replayed here.
 */
export async function verifyFormToken(
  token: string | undefined | null,
  now: number = Date.now()
): Promise<FormTokenFailure | null> {
  if (!token) return 'missing';
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.purpose !== PURPOSE) return 'invalid';
    const issued = payload.issued;
    if (typeof issued !== 'number' || !Number.isFinite(issued)) return 'invalid';

    const age = now - issued;
    // A negative age means a clock skew or a forged stamp from the future.
    if (age < MIN_AGE_MS) return 'too-fast';
    if (age > MAX_AGE_MS) return 'expired';
    return null;
  } catch {
    // Tampered, or signed with a different secret.
    return 'invalid';
  }
}
