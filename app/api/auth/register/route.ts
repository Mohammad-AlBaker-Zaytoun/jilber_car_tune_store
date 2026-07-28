import { NextResponse, after } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { findUserByEmail, createUser } from '@/lib/users';
import { sendVerificationEmail } from '@/lib/email-verification';
import { notifyRegistrationAttemptOnExistingAccount } from '@/lib/auth-notifications';
import { rateLimit, getClientIp, tooManyRequests } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

const schema = z
  .object({
    name: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    terms: z.boolean(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((d) => d.terms === true, {
    message: 'You must accept the terms',
    path: ['terms'],
  });

export async function POST(request: Request) {
  try {
    const rl = rateLimit('register:' + getClientIp(request), 5, 600_000);
    if (!rl.ok) return tooManyRequests(rl.retryAfter);

    const body: unknown = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      return NextResponse.json({ error: 'Validation failed', errors }, { status: 400 });
    }

    const { name, email, phone, password } = result.data;

    const existing = await findUserByEmail(email);

    if (existing) {
      // Neutral response — this used to return 409 "An account with this email
      // already exists", which is a free, definitive account-enumeration oracle
      // (forgot-password and resend-verification already answer neutrally).
      //
      // Still hash, so the response time matches the create path and does not
      // leak the same fact through timing instead.
      await bcrypt.hash(password, 12);

      // Tell the real account holder, not the requester. If this was them, it is
      // the nudge they need; if it was someone probing, they learn nothing.
      after(() => notifyRegistrationAttemptOnExistingAccount(existing.name, existing.email));

      logger.info('auth.register_existing_email', { email });
      return NextResponse.json({ success: true }, { status: 201 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const created = await createUser({ email, name, phone, passwordHash, role: 'user' });

    after(() => sendVerificationEmail(created.id, created.name, created.email));

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    logger.error('register.unhandled', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
