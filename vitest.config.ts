import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Integration tests need a real database — see vitest.integration.config.ts.
    exclude: ['tests/integration/**'],
  },
});
