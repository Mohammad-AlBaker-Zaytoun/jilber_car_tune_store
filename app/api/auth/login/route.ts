import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { findUserByEmail } from '@/lib/users';
import { createToken, setSessionCookie, type SessionUser } from '@/lib/auth';
import { rateLimit, getClientIp, tooManyRequests } from '@/lib/rate-limit';
import {
  checkLoginThrottle,
  recordLoginFailure,
  clearLoginFailures,
} from '@/lib/login-throttle';
import { logger } from '@/lib/logger';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/**
 * A real bcrypt hash (cost 12) of a value nobody can supply, compared against
 * when the account does not exist so the timing of both branches matches.
 * Must be a valid hash or bcrypt.compare returns immediately, defeating the point.
 */
const DUMMY_HASH = '$2b$12$C6UzMDM.H6dfI/f/IKcEe.7QQVQ0kZ6TfKKvxJZ5hVJqrKf1PjJ0K';

export async function POST(request: Request) {
  try {
    const rl = rateLimit('login:' + getClientIp(request), 5, 60_000);
    if (!rl.ok) return tooManyRequests(rl.retryAfter);

    const body: unknown = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 400 });
    }

    const { email, password } = result.data;

    // Per-account lockout. IP limiting alone leaves a known email open to
    // distributed credential stuffing, where every bot gets its own IP budget.
    const throttle = checkLoginThrottle(email);
    if (throttle.locked) {
      logger.warn('auth.login_locked', { email, retryAfter: throttle.retryAfter });
      return tooManyRequests(throttle.retryAfter);
    }

    const user = await findUserByEmail(email);

    // Always run a bcrypt comparison, even when the user does not exist.
    // Returning early skipped the ~250ms hash and made "no such account" vs
    // "wrong password" trivially distinguishable by response time — an account
    // enumeration oracle that the identical error message otherwise prevents.
    const match = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);

    if (!user || !match) {
      const state = recordLoginFailure(email);
      logger.info('auth.login_failed', {
        email,
        reason: user ? 'bad_password' : 'no_such_user',
        nowLocked: state.locked,
      });
      if (state.locked) return tooManyRequests(state.retryAfter);
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    clearLoginFailures(email);

    const sessionUser: SessionUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role ?? 'user',
      createdAt: user.createdAt,
      tokenVersion: user.tokenVersion,
    };

    const token = await createToken(sessionUser);
    const response = NextResponse.json({ user: sessionUser });
    setSessionCookie(response, token);
    return response;
  } catch (err) {
    logger.error('login.unhandled', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
