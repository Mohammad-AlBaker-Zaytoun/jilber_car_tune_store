/**
 * Server-only admin authorization helpers.
 * Do NOT import this file in edge runtime code (middleware).
 */

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
  console.error('[admin]', err);
  return Response.json({ error: 'Internal server error' }, { status: 500 });
}
