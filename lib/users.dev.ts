/**
 * User repository — MSSQL via Prisma.
 *
 * Public function names/signatures unchanged from the old JSON store. The
 * passwordHash is never returned by listUsers/updateUser. Email is stored and
 * matched case-insensitively (persisted lowercased).
 */

import { randomUUID } from 'crypto';
import { prisma } from '@/lib/db/prisma';
import type { User as UserRow } from '@prisma/client';
import type { UserRole } from '@/types/admin';

export interface StoredUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  /** bcrypt hash — never exposed to clients */
  passwordHash: string;
  role: UserRole;
  createdAt: string;
}

function rowToUser(row: UserRow): StoredUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    phone: row.phone ?? undefined,
    passwordHash: row.passwordHash,
    role: row.role as UserRole,
    createdAt: row.createdAt.toISOString(),
  };
}

function stripHash(u: StoredUser): Omit<StoredUser, 'passwordHash'> {
  const { passwordHash: _passwordHash, ...safe } = u;
  return safe;
}

export async function findUserByEmail(email: string): Promise<StoredUser | null> {
  const row = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  return row ? rowToUser(row) : null;
}

export async function findUserById(id: string): Promise<StoredUser | null> {
  const row = await prisma.user.findUnique({ where: { id } });
  return row ? rowToUser(row) : null;
}

export async function createUser(
  data: Omit<StoredUser, 'id' | 'createdAt'>
): Promise<StoredUser> {
  const row = await prisma.user.create({
    data: {
      id: randomUUID(),
      email: data.email.toLowerCase(),
      name: data.name,
      phone: data.phone,
      passwordHash: data.passwordHash,
      role: data.role ?? 'user',
    },
  });
  return rowToUser(row);
}

export async function updateUser(
  id: string,
  data: Partial<Omit<StoredUser, 'id' | 'createdAt' | 'passwordHash'>>
): Promise<Omit<StoredUser, 'passwordHash'> | null> {
  const current = await prisma.user.findUnique({ where: { id } });
  if (!current) return null;

  const row = await prisma.user.update({
    where: { id },
    data: {
      ...(data.email !== undefined ? { email: data.email.toLowerCase() } : {}),
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.phone !== undefined ? { phone: data.phone } : {}),
      ...(data.role !== undefined ? { role: data.role } : {}),
    },
  });
  return stripHash(rowToUser(row));
}

/** Sets a new bcrypt password hash for a user. Returns false if the user is gone. */
export async function updateUserPassword(id: string, passwordHash: string): Promise<boolean> {
  try {
    await prisma.user.update({ where: { id }, data: { passwordHash } });
    return true;
  } catch {
    return false;
  }
}

export async function listUsers(): Promise<Omit<StoredUser, 'passwordHash'>[]> {
  const rows = await prisma.user.findMany({ orderBy: { createdAt: 'asc' } });
  return rows.map((r) => stripHash(rowToUser(r)));
}

export async function countUsers(): Promise<number> {
  return prisma.user.count();
}
