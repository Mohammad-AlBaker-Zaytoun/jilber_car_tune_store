import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { findUserById } from '@/lib/users';
import { sendVerificationEmail } from '@/lib/email-verification';
import { rateLimit, getClientIp, tooManyRequests } from '@/lib/rate-limit';

/**
 * POST /api/auth/resend-verification — re-send the verification email to the
 * signed-in user. Session-scoped (no email param), so there's no enumeration
 * surface. No-op if the address is already verified.
 */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rl = rateLimit('resend-verification:' + getClientIp(request), 5, 600_000);
    if (!rl.ok) return tooManyRequests(rl.retryAfter);

    const user = await findUserById(session.id);
    if (user && !user.emailVerifiedAt) {
      await sendVerificationEmail(user.id, user.name, user.email);
    }

    // Generic response either way.
    return NextResponse.json({
      success: true,
      message: 'If your email needs verifying, a new link has been sent.',
    });
  } catch (err) {
    console.error('[auth/resend-verification]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
