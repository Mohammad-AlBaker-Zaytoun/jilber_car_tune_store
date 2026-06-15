import { NextResponse, type NextRequest } from 'next/server';
import { getSessionFromRequest, createToken, setSessionCookie } from '@/lib/auth';
import { isSameOriginRequest } from '@/lib/csrf';

// ---------------------------------------------------------------------------
// In-memory rate limiter
// NOTE: state is per-process. For multi-instance deployments replace this with
// a shared store (e.g. Upstash Redis + @upstash/ratelimit).
// ---------------------------------------------------------------------------
interface RateWindow { count: number; resetAt: number }
const rateStore = new Map<string, RateWindow>();

function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const win = rateStore.get(key);
  if (!win || now > win.resetAt) {
    rateStore.set(key, { count: 1, resetAt: now + windowMs });
    return false; // not limited
  }
  if (win.count >= limit) return true; // limited
  win.count++;
  return false;
}

const RATE_LIMITS = [
  { path: '/api/auth/login',    method: 'POST', limit: 10, windowMs: 5 * 60 * 1000 },
  { path: '/api/auth/register', method: 'POST', limit: 5,  windowMs: 5 * 60 * 1000 },
  { path: '/api/orders',        method: 'POST', limit: 10, windowMs: 5 * 60 * 1000 },
] as const;

// ---------------------------------------------------------------------------

const PROTECTED = ['/account', '/checkout'];
const AUTH_ONLY = ['/signin', '/signup'];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // CSRF: reject cross-origin state-changing requests to the API before they
  // reach any handler. Read-only methods and same-origin requests pass through.
  if (pathname.startsWith('/api/') && !isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: 'Cross-origin request blocked.' },
      { status: 403 }
    );
  }

  // Rate-limit sensitive mutation endpoints before doing anything else
  const rl = RATE_LIMITS.find((r) => r.path === pathname && r.method === request.method);
  if (rl) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
    if (checkRateLimit(`${rl.path}:${ip}`, rl.limit, rl.windowMs)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }
  }

  // API routes only need the CSRF + rate-limit gates above; the auth/redirect
  // and sliding-session logic below applies to page navigations only.
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  const isAuthPage = AUTH_ONLY.some((p) => pathname.startsWith(p));
  const isAdminRoute = pathname.startsWith('/admin');

  const user = await getSessionFromRequest(request);

  // Auth/role redirects — any return here is a redirect, no sliding renewal needed
  if (isAdminRoute) {
    if (!user) {
      const url = new URL('/signin', request.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
    if (user.role !== 'admin') {
      return NextResponse.redirect(new URL('/account', request.url));
    }
  } else if (isProtected && !user) {
    const url = new URL('/signin', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  } else if (isAuthPage && user) {
    return NextResponse.redirect(new URL('/account', request.url));
  }

  const response = NextResponse.next();

  // Sliding session: on every authenticated page hit, issue a fresh cookie so
  // active sessions never expire mid-use. API routes are excluded — only browser
  // page navigations renew the session.
  if (user && !pathname.startsWith('/api/')) {
    const newToken = await createToken(user);
    setSessionCookie(response, newToken);
  }

  return response;
}

export const config = {
  matcher: [
    '/account/:path*',
    '/checkout',
    '/signin',
    '/signup',
    '/admin/:path*',
    // All API routes — rate limiting (subset) + CSRF origin check (all mutations)
    '/api/:path*',
  ],
};
