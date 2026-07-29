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
import { hashEmail } from '@/lib/log-privacy';

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
    const ip = getClientIp(request);
    const rl = rateLimit('login:' + ip, 5, 60_000);
    if (!rl.ok) return tooManyRequests(rl.retryAfter);

    const body: unknown = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 400 });
    }

    const { email, password } = result.data;

    // Lockout is keyed on (account, source IP), not the account alone — an
    // account-only key would let anyone permanently deny a known user, since
    // this check runs before the password is verified. See lib/login-throttle.ts.
    const throttle = checkLoginThrottle(email, ip);
    if (throttle.locked) {
      logger.warn('auth.login_locked', { emailHash: hashEmail(email), ip, retryAfter: throttle.retryAfter });
      return tooManyRequests(throttle.retryAfter);
    }

    const user = await findUserByEmail(email);

    // Always run a bcrypt comparison, even when the user does not exist.
    // Returning early skipped the ~250ms hash and made "no such account" vs
    // "wrong password" trivially distinguishable by response time — an account
    // enumeration oracle that the identical error message otherwise prevents.
    const match = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);

    if (!user || !match) {
      const state = recordLoginFailure(email, ip);
      logger.info('auth.login_failed', {
        emailHash: hashEmail(email),
        ip,
        reason: user ? 'bad_password' : 'no_such_user',
        nowLocked: state.locked,
      });
      // Failures piling up across many source IPs for one account is the
      // signature of distributed credential stuffing, which the per-source
      // lockout deliberately does not block. Surface it instead.
      if (state.distributedAttack) {
        logger.warn('auth.distributed_login_attack', { emailHash: hashEmail(email) });
      }
      if (state.locked) return tooManyRequests(state.retryAfter);
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    clearLoginFailures(email, ip);

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
