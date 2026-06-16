import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { consumeResetToken } from '@/lib/password-reset';
import { updateUserPassword, incrementTokenVersion } from '@/lib/users';
import { rateLimit, getClientIp, tooManyRequests } from '@/lib/rate-limit';

const schema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters').max(200),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

/**
 * POST /api/auth/reset-password — complete a password reset with a valid token.
 * The token is single-use; consuming it marks it used atomically.
 */
export async function POST(request: Request) {
  try {
    const rl = rateLimit('reset-password:' + getClientIp(request), 5, 600_000);
    if (!rl.ok) return tooManyRequests(rl.retryAfter);

    const body: unknown = await request.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const userId = await consumeResetToken(result.data.token);
    if (!userId) {
      return NextResponse.json(
        { error: 'This reset link is invalid or has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    const newHash = await bcrypt.hash(result.data.newPassword, 12);
    const updated = await updateUserPassword(userId, newHash);
    if (!updated) {
      return NextResponse.json({ error: 'Account no longer exists.' }, { status: 404 });
    }

    // Invalidate any existing sessions — a reset implies the old credentials
    // (and any sessions opened with them) should no longer be trusted.
    await incrementTokenVersion(userId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[auth/reset-password]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
