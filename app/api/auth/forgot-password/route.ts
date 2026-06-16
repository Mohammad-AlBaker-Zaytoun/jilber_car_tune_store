import { NextResponse } from 'next/server';
import { z } from 'zod';
import { findUserByEmail } from '@/lib/users';
import { createResetToken } from '@/lib/password-reset';
import { sendEmail, emailLayout, escapeHtml } from '@/lib/email';
import { siteConfig } from '@/lib/seo/site-config';
import { rateLimit, getClientIp, tooManyRequests } from '@/lib/rate-limit';

const schema = z.object({ email: z.string().email() });

/**
 * POST /api/auth/forgot-password — start a password reset.
 *
 * Always responds 200 with the same body whether or not the email exists, to
 * avoid leaking which addresses are registered (account enumeration). When the
 * user exists and email is configured, a reset link is sent.
 */
export async function POST(request: Request) {
  try {
    const rl = rateLimit('forgot-password:' + getClientIp(request), 5, 600_000);
    if (!rl.ok) return tooManyRequests(rl.retryAfter);

    const body: unknown = await request.json();
    const result = schema.safeParse(body);
    // Even on a malformed/absent email we return the generic success below.
    if (result.success) {
      const user = await findUserByEmail(result.data.email);
      if (user) {
        const rawToken = await createResetToken(user.id);
        const resetUrl = `${siteConfig.siteUrl}/reset-password?token=${rawToken}`;
        await sendEmail({
          to: user.email,
          subject: 'Reset your JILBER password',
          html: emailLayout(
            'Password reset',
            `<p>Hi ${escapeHtml(user.name)},</p>
             <p>We received a request to reset your password. Click the button below to choose a new one. This link expires in 1 hour.</p>
             <p style="margin:24px 0">
               <a href="${resetUrl}" style="background:#0891b2;color:#fff;padding:12px 20px;text-decoration:none;font-weight:bold;border-radius:4px;display:inline-block">Reset password</a>
             </p>
             <p style="font-size:12px;color:#71717a">If you didn't request this, you can safely ignore this email — your password won't change.</p>`
          ),
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'If an account exists for that email, a reset link has been sent.',
    });
  } catch (err) {
    console.error('[auth/forgot-password]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
