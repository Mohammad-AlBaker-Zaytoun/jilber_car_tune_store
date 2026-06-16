import { NextResponse, type NextRequest } from 'next/server';
import { getSessionFromRequest, createToken, setSessionCookie } from '@/lib/auth';
import { isSameOriginRequest } from '@/lib/csrf';

// Rate limiting lives in the individual API route handlers (lib/rate-limit.ts),
// which is the single source of truth for limits. The proxy only enforces CSRF
// origin checks and page-level auth redirects here.

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

  // API routes only need the CSRF gate above; the auth/redirect and
  // sliding-session logic below applies to page navigations only.
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
