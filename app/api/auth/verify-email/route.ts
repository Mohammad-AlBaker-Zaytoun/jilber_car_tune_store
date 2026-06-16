import { NextResponse } from 'next/server';
import { z } from 'zod';
import { consumeVerificationToken } from '@/lib/email-verification';
import { markEmailVerified } from '@/lib/users';
import { rateLimit, getClientIp, tooManyRequests } from '@/lib/rate-limit';

const schema = z.object({ token: z.string().min(1, 'Verification token is required') });

/**
 * POST /api/auth/verify-email — confirm an email address with a valid token.
 * The token is single-use; consuming it marks it used atomically.
 */
export async function POST(request: Request) {
  try {
    const rl = rateLimit('verify-email:' + getClientIp(request), 10, 600_000);
    if (!rl.ok) return tooManyRequests(rl.retryAfter);

    const body: unknown = await request.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const userId = await consumeVerificationToken(result.data.token);
    if (!userId) {
      return NextResponse.json(
        { error: 'This verification link is invalid or has expired. Request a new one.' },
        { status: 400 }
      );
    }

    const ok = await markEmailVerified(userId);
    if (!ok) {
      return NextResponse.json({ error: 'Account no longer exists.' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[auth/verify-email]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
