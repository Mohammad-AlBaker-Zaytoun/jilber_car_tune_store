import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { getSessionWithUser } from '@/lib/session';
import { updateUserPassword, incrementTokenVersion } from '@/lib/users';
import { createToken, setSessionCookie, type SessionUser } from '@/lib/auth';
import { rateLimit, getClientIp, tooManyRequests } from '@/lib/rate-limit';

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters').max(200),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

/** POST /api/account/password — change the signed-in user's password. */
export async function POST(request: Request) {
  try {
    const resolved = await getSessionWithUser();
    if (!resolved) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = resolved;

    const rl = rateLimit('password:' + getClientIp(request), 5, 600_000);
    if (!rl.ok) return tooManyRequests(rl.retryAfter);

    const body: unknown = await request.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const match = await bcrypt.compare(result.data.currentPassword, user.passwordHash);
    if (!match) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    const newHash = await bcrypt.hash(result.data.newPassword, 12);
    await updateUserPassword(user.id, newHash);

    // Invalidate every existing session for this user, then re-issue a fresh
    // cookie for the current one so the password-changer stays signed in while
    // other devices are logged out.
    const newVersion = await incrementTokenVersion(user.id);
    const sessionUser: SessionUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
      tokenVersion: newVersion ?? (user.tokenVersion + 1),
    };
    const token = await createToken(sessionUser);
    const response = NextResponse.json({ success: true });
    setSessionCookie(response, token);
    return response;
  } catch (err) {
    console.error('[account/password POST]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
