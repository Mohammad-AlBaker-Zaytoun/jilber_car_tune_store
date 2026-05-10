/**
 * Server-only session helpers that read from the Next.js cookie store.
 * Do NOT import this file in middleware or edge runtime code.
 * For edge/middleware use, import getSessionFromRequest from lib/auth.ts instead.
 */
import { cookies } from 'next/headers';
import { COOKIE_NAME, verifyToken, type SessionUser } from './auth';

export type { SessionUser };

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}
