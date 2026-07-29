import 'dotenv/config';
import path from 'node:path';
import { defineConfig } from 'prisma/config';

/**
 * Prisma CLI configuration.
 *
 * Prisma 7 makes this the configuration surface. Two things moved here:
 *
 *  1. The seed command, which used to live in `package.json#prisma` — that block
 *     is no longer read at all.
 *  2. The Migrate connection URL. Prisma 7 rejects `url` inside the schema's
 *     `datasource` block; the schema now declares only `provider`. The RUNTIME
 *     connection is separate and comes from the driver adapter passed to the
 *     PrismaClient constructor (lib/db/adapter.ts) — this URL is used by the CLI
 *     (`migrate deploy`, `migrate diff`, `db execute`) only.
 *
 * NOTE: this file does NOT auto-load `.env` the way the Prisma 6 CLI did, hence
 * the `dotenv/config` import — without it `prisma migrate deploy` on the VPS
 * would not see DATABASE_URL.
 */
/**
 * Deliberately NOT `env('DATABASE_URL')`: that helper THROWS when the variable
 * is missing, and it is evaluated whenever this config loads — including for
 * `prisma generate`, which needs no database at all. That broke `npm ci`
 * (postinstall runs generate) anywhere without a .env, such as the DB-free CI
 * job and a fresh clone.
 *
 * Declaring the datasource only when the URL is actually present keeps codegen
 * working offline while still giving Migrate what it needs.
 */
const databaseUrl = process.env.DATABASE_URL;

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  migrations: {
    path: path.join('prisma', 'migrations'),
    // `npm run db:seed` — still refuses to run against production, see
    // prisma/seed.ts. Use `npm run db:seed:admin` on a real deployment.
    seed: 'tsx prisma/seed.ts',
  },
  ...(databaseUrl ? { datasource: { url: databaseUrl } } : {}),
});
