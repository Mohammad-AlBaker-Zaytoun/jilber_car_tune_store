import { NextResponse } from 'next/server';
import { createFormToken } from '@/lib/form-token';
import { rateLimit, getClientIp, tooManyRequests } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

/**
 * Issues the token POST /api/contact requires.
 *
 * Must be dynamic: a cached response would hand every visitor the same issue
 * time, which is exactly the stamp the minimum-age check reads.
 *
 * Rate limited on its own, and more generously than the submit endpoint — a
 * real visitor fetches one per page load, while an abuser trying to farm tokens
 * has to come back here for every attempt.
 */
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const rl = rateLimit('contact-token:' + getClientIp(request), 30, 600_000);
    if (!rl.ok) return tooManyRequests(rl.retryAfter);

    const token = await createFormToken();
    return NextResponse.json(
      { token },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (err) {
    logger.error('contact.form_token.unhandled', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
