/**
 * Single shared PrismaClient.
 *
 * In dev, Next.js HMR re-evaluates modules on every edit; without caching on
 * globalThis we'd open a new connection pool each time and exhaust the DB.
 *
 * Prisma 7 requires a driver adapter for every database — see lib/db/adapter.ts.
 *
 * LAZY BY DESIGN. Under Prisma 6, `new PrismaClient()` was cheap and did not
 * need a connection string until the first query. Under Prisma 7 the adapter is
 * built eagerly from DATABASE_URL, so constructing at module scope meant that
 * merely *importing* any repository module (lib/orders.ts, lib/users.ts, …)
 * threw when DATABASE_URL was unset — which broke the unit tests for the pure
 * helpers that happen to live in those files, and would break any script that
 * imports one without needing the database.
 *
 * The proxy below restores the old behaviour: nothing is constructed until a
 * property is actually touched.
 */
import { PrismaClient } from '@prisma/client';
import { createPrismaAdapter } from './adapter';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient(): PrismaClient {
  return new PrismaClient({
    adapter: createPrismaAdapter(),
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
}

function getClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    const client = createClient();
    // Cache in dev to survive HMR; in production the module itself is the cache.
    if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = client;
    else globalForPrisma.prisma = client;
  }
  return globalForPrisma.prisma;
}

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getClient();
    const value = Reflect.get(client, prop, receiver);
    // Model delegates and $-methods must stay bound to the real client.
    return typeof value === 'function' ? value.bind(client) : value;
  },
  has(_target, prop) {
    return prop in getClient();
  },
});
