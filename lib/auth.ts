import { SignJWT, jwtVerify } from 'jose';
import type { NextRequest, NextResponse } from 'next/server';
import type { UserRole } from '@/types/admin';

export { type UserRole };

export const COOKIE_NAME = 'jilber-session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET environment variable is not set');
  if (secret.length < 32) throw new Error('AUTH_SECRET must be at least 32 characters');
  return new TextEncoder().encode(secret);
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
}

export async function createToken(user: SessionUser): Promise<string> {
  return new SignJWT({ id: user.id, email: user.email, name: user.name, phone: user.phone, role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const { id, email, name, phone, role } = payload;
    if (typeof id !== 'string' || typeof email !== 'string' || typeof name !== 'string') {
      return null;
    }
    return {
      id, email, name,
      phone: typeof phone === 'string' ? phone : undefined,
      role: role === 'admin' ? 'admin' : 'user',
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
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
}

/** Clears the session cookie on a NextResponse. */
export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
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
