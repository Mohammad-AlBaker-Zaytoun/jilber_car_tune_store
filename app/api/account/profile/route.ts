import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/session';
import { findUserById, updateUser } from '@/lib/users';
import { createToken, setSessionCookie, type SessionUser } from '@/lib/auth';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
  phone: z.string().max(30).optional(),
});

/** PATCH /api/account/profile — update the signed-in user's own name/phone. */
export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: unknown = await request.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updated = await updateUser(session.id, result.data);
    if (!updated) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Re-issue the session cookie so the JWT reflects the new name/phone.
    const live = await findUserById(session.id);
    const sessionUser: SessionUser = {
      id: session.id,
      email: updated.email,
      name: updated.name,
      phone: updated.phone,
      role: updated.role,
      createdAt: live?.createdAt ?? session.createdAt,
    };
    const token = await createToken(sessionUser);
    const response = NextResponse.json({ user: sessionUser });
    setSessionCookie(response, token);
    return response;
  } catch (err) {
    console.error('[account/profile PATCH]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
