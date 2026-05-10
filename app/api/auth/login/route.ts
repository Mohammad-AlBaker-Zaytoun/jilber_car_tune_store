import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { findUserByEmail } from '@/lib/users.dev';
import { createToken, setSessionCookie, type SessionUser } from '@/lib/auth';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 400 });
    }

    const { email, password } = result.data;

    const user = findUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const sessionUser: SessionUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role ?? 'user',
    };

    const token = await createToken(sessionUser);
    const response = NextResponse.json({ user: sessionUser });
    setSessionCookie(response, token);
    return response;
  } catch (err) {
    console.error('[login]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
