/**
 * Single shared PrismaClient.
 *
 * In dev, Next.js HMR re-evaluates modules on every edit; without caching on
 * globalThis we'd open a new connection pool each time and exhaust the DB.
 *
 * Prisma 7 requires a driver adapter for every database — see lib/db/adapter.ts.
 */
import { PrismaClient } from '@prisma/client';
import { createPrismaAdapter } from './adapter';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: createPrismaAdapter(),
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
