/**
 * Server-only admin authorization helpers.
 * Do NOT import this file in edge runtime code (middleware).
 */

import { Prisma } from '@prisma/client';
import { getSession } from './session';
import { findUserById } from './users.dev';
import type { SessionUser } from './auth';

export class AdminError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = 'AdminError';
  }
}

/** True when the error is a Prisma unique-constraint violation (P2002). */
export function isUniqueConstraintError(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002';
}

export async function requireAdmin(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw new AdminError('Unauthorized', 401);
  if (session.role !== 'admin') throw new AdminError('Forbidden — admin access required', 403);

  // Re-verify the current role from the live store so a demotion takes effect
  // immediately, without waiting for the JWT to expire (up to 24 hours).
  const live = await findUserById(session.id);
  if (!live || live.role !== 'admin') {
    throw new AdminError('Forbidden — admin access required', 403);
  }

  return session;
}

export function handleAdminError(err: unknown): Response {
  if (err instanceof AdminError) {
    return Response.json({ error: err.message }, { status: err.status });
  }
  if (isUniqueConstraintError(err)) {
    return Response.json(
      { error: 'A record with these details already exists.' },
      { status: 409 }
    );
  }
  console.error('[admin]', err);
  return Response.json({ error: 'Internal server error' }, { status: 500 });
}
