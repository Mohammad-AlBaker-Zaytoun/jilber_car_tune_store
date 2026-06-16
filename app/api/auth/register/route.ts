import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { findUserByEmail, createUser } from '@/lib/users';
import { sendVerificationEmail } from '@/lib/email-verification';
import { rateLimit, getClientIp, tooManyRequests } from '@/lib/rate-limit';

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

    if (await findUserByEmail(email)) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const created = await createUser({ email, name, phone, passwordHash, role: 'user' });

    // Fire-and-forget verification email (env-gated, best-effort).
    void sendVerificationEmail(created.id, created.name, created.email);

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error('[register]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
