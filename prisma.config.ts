import 'dotenv/config';
import path from 'node:path';
import { defineConfig } from 'prisma/config';

/**
 * Prisma CLI configuration.
 *
 * Prisma 7 makes this the configuration surface; the old `package.json#prisma`
 * block (which held the seed command) is no longer read and has been removed.
 *
 * NOTE: unlike the CLI's implicit behaviour under Prisma 6, this file does NOT
 * auto-load `.env` — hence the `dotenv/config` import above, without which
 * `prisma migrate deploy` on the VPS would not see DATABASE_URL.
 */
export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  migrations: {
    path: path.join('prisma', 'migrations'),
    // `npm run db:seed` — still guarded to refuse against production, see
    // prisma/seed.ts. Use `npm run db:seed:admin` on a real deployment.
    seed: 'tsx prisma/seed.ts',
  },
});
