/**
 * Server-only session helpers that read from the Next.js cookie store.
 * Do NOT import this file in middleware or edge runtime code.
 * For edge/middleware use, import getSessionFromRequest from lib/auth.ts instead.
 */
import { cookies } from 'next/headers';
import { COOKIE_NAME, verifyToken, type SessionUser } from './auth';
import { findUserById, type StoredUser } from './users';

export type { SessionUser };

/**
 * Resolves the current session from the cookie, returning both the decoded
 * session and the live user row.
 *
 * Beyond verifying the JWT signature, this reads the user's live `tokenVersion`
 * and rejects the token if it's stale — so a password change/reset (which bumps
 * tokenVersion) invalidates every previously issued token immediately, rather
 * than waiting up to 24h for expiry. This costs one DB read per call; that
 * tradeoff was chosen deliberately over stateless-only sessions.
 *
 * Callers that also need live fields (role, emailVerifiedAt, …) should use this
 * instead of calling getSession() + findUserById() — that would read twice.
 *
 * Edge/middleware code uses getSessionFromRequest (lib/auth.ts), which is
 * JWT-only and does not perform this check.
 */
export async function getSessionWithUser(): Promise<
  { session: SessionUser; user: StoredUser } | null
> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await verifyToken(token);
  if (!session) return null;

  const user = await findUserById(session.id);
  if (!user) return null;
  if (user.tokenVersion !== (session.tokenVersion ?? 0)) return null;

  return { session, user };
}

/** Convenience wrapper when only the decoded session is needed. */
export async function getSession(): Promise<SessionUser | null> {
  return (await getSessionWithUser())?.session ?? null;
}
