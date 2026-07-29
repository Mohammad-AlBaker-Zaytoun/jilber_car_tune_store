/**
 * Prisma driver adapter for SQL Server.
 *
 * Prisma 7 removed the built-in engine connectors: every database now goes
 * through a driver adapter. `@prisma/adapter-mssql` wraps the `mssql` (tedious)
 * driver and accepts the same JDBC-style connection string already used in
 * DATABASE_URL, so no connection-string rewriting was required.
 *
 * Kept separate from prisma.ts so the standalone scripts (prisma/seed.ts,
 * prisma/seed-admin.ts) can construct their own client with identical
 * configuration instead of duplicating the wiring.
 */
import { PrismaMssql } from '@prisma/adapter-mssql';

export function createPrismaAdapter(): PrismaMssql {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set — Prisma cannot connect. See .env.example.'
    );
  }
  return new PrismaMssql(url);
}
