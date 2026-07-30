import { SignJWT, jwtVerify } from 'jose';
import type { NextRequest, NextResponse } from 'next/server';
import type { UserRole } from '@/types/admin';

export { type UserRole };

export const COOKIE_NAME = 'protuning-session';
// 24-hour idle window; the proxy renews the cookie on every authenticated page
// load so active sessions slide forward while inactive ones expire predictably.
const COOKIE_MAX_AGE = 60 * 60 * 24;

/**
 * Absolute session lifetime, in seconds (7 days).
 *
 * The sliding renewal above has no ceiling on its own: a session used once a day
 * is renewed forever, so a stolen cookie stays valid indefinitely as long as it
 * keeps being used. `sat` (session-started-at) is carried across renewals and
 * checked here, forcing a real re-authentication after this long no matter how
 * active the session is.
 */
const ABSOLUTE_SESSION_MAX_AGE = 60 * 60 * 24 * 7;

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET environment variable is not set');
  if (secret.length < 32) throw new Error('AUTH_SECRET must be at least 32 characters');
  return new TextEncoder().encode(secret);
}

/** Called once at server startup (via instrumentation.ts) to fail fast on misconfiguration. */
export function validateAuthSecret(): void {
  getSecret();
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  /** ISO timestamp of account creation — used for "member since". */
  createdAt?: string;
  /**
   * The user's tokenVersion at the time this token was issued. getSession()
   * compares it against the live value to revoke tokens after a password change.
   * Defaults to 0 for pre-existing tokens that lack the claim.
   */
  tokenVersion?: number;
  /**
   * Session-started-at, as a UNIX timestamp in seconds. Set once at sign-in and
   * carried unchanged through every sliding renewal so the absolute lifetime is
   * measured from the original authentication, not the last page view.
   */
  sessionStartedAt?: number;
}

export async function createToken(user: SessionUser): Promise<string> {
  const nowSeconds = Math.floor(Date.now() / 1000);
  return new SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role,
    createdAt: user.createdAt,
    tv: user.tokenVersion ?? 0,
    // Preserve the original value on renewal; only a fresh sign-in starts a new
    // window. Renewing this would make the ceiling slide too, defeating it.
    sat: user.sessionStartedAt ?? nowSeconds,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const { id, email, name, phone, role, createdAt, tv, sat } = payload;
    if (typeof id !== 'string' || typeof email !== 'string' || typeof name !== 'string') {
      return null;
    }

    // Absolute lifetime. Tokens issued before this claim existed have no `sat`;
    // treat them as starting now rather than rejecting every live session on
    // deploy — they still expire within 24h of going idle.
    if (typeof sat === 'number') {
      const ageSeconds = Math.floor(Date.now() / 1000) - sat;
      if (ageSeconds > ABSOLUTE_SESSION_MAX_AGE) return null;
    }

    return {
      id, email, name,
      phone: typeof phone === 'string' ? phone : undefined,
      role: role === 'admin' ? 'admin' : 'user',
      createdAt: typeof createdAt === 'string' ? createdAt : undefined,
      tokenVersion: typeof tv === 'number' ? tv : 0,
      sessionStartedAt: typeof sat === 'number' ? sat : undefined,
    };
  } catch {
    return null;
  }
}

/** Edge-safe: reads and verifies the session from the incoming request. */
export async function getSessionFromRequest(request: NextRequest): Promise<SessionUser | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/** Sets the httpOnly session cookie on a NextResponse. */
export function setSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
}

/** Clears the session cookie on a NextResponse. */
export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}

/**
 * Returns a safe relative redirect path.
 * Rejects absolute URLs (e.g. https://evil.com) and protocol-relative URLs (//).
 */
export function safeRedirect(redirect: string | null | undefined, fallback = '/account'): string {
  if (!redirect || typeof redirect !== 'string') return fallback;
  if (!redirect.startsWith('/') || redirect.startsWith('//')) return fallback;
  return redirect;
}
