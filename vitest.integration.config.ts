// Load .env so the suite works locally, not only in CI where DATABASE_URL comes
// from the job environment. Vitest does not read .env by itself.
import 'dotenv/config';
import { defineConfig } from 'vitest/config';
import path from 'path';

/**
 * Integration suite — requires a real MSSQL database via DATABASE_URL.
 *
 * Kept separate from vitest.config.ts so `npm test` stays fast and DB-free,
 * while CI (which already provisions MSSQL for the build) can run the write-path
 * coverage the unit suite cannot provide.
 */
export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.integration.test.ts'],
    // These hit a real database and race deliberately; never run them in
    // parallel against the same rows.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
