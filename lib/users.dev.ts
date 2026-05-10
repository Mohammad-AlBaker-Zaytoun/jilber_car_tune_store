/**
 * DEV-ONLY user store — JSON file on disk.
 *
 * This is intentionally NOT suitable for production. Before deploying:
 *   1. Add a real database (Prisma + PostgreSQL, Supabase, PlanetScale, etc.)
 *   2. Replace this module with a proper data-access layer.
 *   3. The interface — findUserByEmail, findUserById, createUser, updateUser —
 *      is kept minimal so consuming API routes need zero changes.
 *
 * The .dev-users.json file is written to the project root and is gitignored.
 */

import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
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

const DB_PATH = path.join(process.cwd(), '.dev-users.json');

function readStore(): StoredUser[] {
  try {
    if (!fs.existsSync(DB_PATH)) return [];
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw) as StoredUser[];
  } catch {
    return [];
  }
}

function writeStore(users: StoredUser[]): void {
  fs.writeFileSync(DB_PATH, JSON.stringify(users, null, 2), 'utf-8');
}

export function findUserByEmail(email: string): StoredUser | null {
  return readStore().find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export function findUserById(id: string): StoredUser | null {
  return readStore().find((u) => u.id === id) ?? null;
}

export function createUser(data: Omit<StoredUser, 'id' | 'createdAt'>): StoredUser {
  const users = readStore();
  const user: StoredUser = {
    ...data,
    role: data.role ?? 'user',
    id: randomUUID(),
    createdAt: new Date().toISOString(),
  };
  writeStore([...users, user]);
  return user;
}

export function updateUser(
  id: string,
  data: Partial<Omit<StoredUser, 'id' | 'createdAt' | 'passwordHash'>>
): StoredUser | null {
  const users = readStore();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return null;
  users[idx] = { ...users[idx], ...data };
  writeStore(users);
  return users[idx];
}

export function listUsers(): Omit<StoredUser, 'passwordHash'>[] {
  return readStore().map(({ passwordHash: _, ...u }) => u);
}

export function countUsers(): number {
  return readStore().length;
}
