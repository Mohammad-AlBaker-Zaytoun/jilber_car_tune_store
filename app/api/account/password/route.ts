import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { getSession } from '@/lib/session';
import { findUserById, updateUserPassword } from '@/lib/users.dev';
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
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    const user = await findUserById(session.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const match = await bcrypt.compare(result.data.currentPassword, user.passwordHash);
    if (!match) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    const newHash = await bcrypt.hash(result.data.newPassword, 12);
    await updateUserPassword(user.id, newHash);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[account/password POST]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
