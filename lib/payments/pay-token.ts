/**
 * Signed, expiring "pay this order" tokens.
 *
 * Guest checkout is supported (`userId` is undefined for guests, see
 * app/api/orders/route.ts), so a guest whose card payment failed has no
 * /account/orders to return to. The fallback email carries a link containing one
 * of these tokens, which authorises payment for exactly one order.
 *
 * Deliberately stateless — signed with AUTH_SECRET via `jose`, mirroring
 * lib/auth.ts, so there is no new table to migrate or prune. Consequences to be
 * aware of:
 *
 *   - Rotating AUTH_SECRET invalidates every outstanding pay link. That is
 *     acceptable (docs/PRE-LAUNCH.md rotates it before launch, i.e. before any
 *     real link exists) and is documented in .env.example.
 *   - Tokens are NOT single-use: a customer may legitimately need to retry after
 *     abandoning the gateway page. Replay is harmless because the endpoint
 *     re-checks the live order state on every call and refuses anything already
 *     paid, refunded or cancelled.
 */

import { SignJWT, jwtVerify } from 'jose';

/** Distinguishes these from session tokens signed with the same secret. */
const PURPOSE = 'order-pay';
const TTL = '7d';

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET environment variable is not set');
  if (secret.length < 32) throw new Error('AUTH_SECRET must be at least 32 characters');
  return new TextEncoder().encode(secret);
}

/** Mints a pay token for one order. */
export async function createPayToken(orderId: string): Promise<string> {
  return new SignJWT({ orderId, purpose: PURPOSE })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TTL)
    .sign(getSecret());
}

/**
 * Verifies a pay token and returns the order id it authorises, or null.
 *
 * The `purpose` check is what stops a stolen SESSION cookie — signed with the
 * same secret — from being replayed here as a pay token, and vice versa.
 */
export async function verifyPayToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.purpose !== PURPOSE) return null;
    return typeof payload.orderId === 'string' && payload.orderId ? payload.orderId : null;
  } catch {
    // Expired, tampered, or signed with a different secret.
    return null;
  }
}
