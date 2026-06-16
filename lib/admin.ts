/**
 * Server-only admin authorization helpers.
 * Do NOT import this file in edge runtime code (middleware).
 */

import { Prisma } from '@prisma/client';
import { getSessionWithUser } from './session';
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
  // getSessionWithUser already loads the live row (for the tokenVersion check),
  // so we re-verify the role from it without a second DB read. A demotion thus
  // takes effect immediately, without waiting for the JWT to expire.
  const resolved = await getSessionWithUser();
  if (!resolved) throw new AdminError('Unauthorized', 401);
  const { session, user } = resolved;
  if (session.role !== 'admin' || user.role !== 'admin') {
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
