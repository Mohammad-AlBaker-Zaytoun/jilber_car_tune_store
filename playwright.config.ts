import { defineConfig, devices } from '@playwright/test';
import 'dotenv/config';
import dotenv from 'dotenv';

// Mirror Next's precedence: .env.local overrides .env. Without this the E2E
// helpers would talk to a different database/secret than the app under test.
dotenv.config({ path: '.env.local', override: true });

/**
 * End-to-end suite.
 *
 * Two servers run side by side, because the most valuable thing to prove about
 * this store is that it keeps taking orders when the payment gateway does not:
 *
 *   :4310  gateway UNCONFIGURED  — the normal state; card is never offered
 *   :4311  gateway CONFIGURED BUT BROKEN — a real failure, so a real capture
 *
 * The failure is genuine rather than mocked. `page.route()` cannot help here:
 * Whish is called from the SERVER (app/api/orders/route.ts), so a browser-level
 * intercept never sees it. Invalid credentials produce the real code path at no
 * cost, because no charge can succeed against them.
 *
 * NOT COVERED, deliberately: the happy card path. That requires real sandbox
 * credentials and driving Whish's own hosted page, which is not ours to
 * automate. It stays a manual step in docs/PRE-LAUNCH.md.
 */

const UNCONFIGURED_PORT = 4310;
const BROKEN_GATEWAY_PORT = 4311;

/** Shared env for both servers. NODE_ENV is set by `next start` itself. */
const baseEnv = {
  DATABASE_URL: process.env.DATABASE_URL ?? '',
  AUTH_SECRET: process.env.AUTH_SECRET ?? '',
  // Emails must not be sent from a test run.
  RESEND_API_KEY: '',
  ADMIN_EMAIL: '',
  // The app is behind no proxy here, so forwarding headers are untrusted.
  TRUSTED_PROXY_COUNT: '0',
  LOG_LEVEL: 'warn',
  // The suite places more orders per minute from one address than a real
  // storefront ever would. Without this the production default (8) throttles
  // later specs and a 429 masks the guard each one is actually asserting. The
  // limiter itself is still exercised deliberately — see security.spec.ts.
  ORDER_RATE_LIMIT_PER_MINUTE: '200',
};

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',

  // Each spec file gets a worker; tests inside a file run in order. Several
  // specs assert on shared server state (the circuit breaker, admin lists), so
  // full cross-file parallelism would make them fight each other.
  fullyParallel: false,
  workers: 1,

  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },

  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }], ['list']]
    : // `list` narrates each step as it runs, which is what you want when
      // showing this to someone; the HTML report is the artefact you hand over.
      [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: `http://localhost:${UNCONFIGURED_PORT}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Slightly slower actions make a live demo followable without being painful.
    ...(process.env.E2E_DEMO ? { launchOptions: { slowMo: 350 } } : {}),
  },

  projects: [
    {
      // Seeds the fixtures every other project depends on, once per run.
      name: 'setup',
      testMatch: /global\.setup\.ts/,
    },
    {
      name: 'storefront',
      dependencies: ['setup'],
      testIgnore: /gateway-outage\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      // Phone viewport for the money path — the store is mobile-first in
      // practice. Chromium, not WebKit: the session cookie is `Secure`
      // (lib/auth.ts), and WebKit refuses Secure cookies over plain http where
      // Chromium exempts localhost. Since /checkout requires a session, an
      // authenticated WebKit run is impossible against these plaintext servers.
      // Production is HTTPS, so this is a test-environment limit, not a defect —
      // and loosening a session cookie to work around it would be the wrong
      // trade entirely.
      name: 'mobile',
      dependencies: ['setup'],
      testMatch: /storefront\.spec\.ts|checkout\.spec\.ts/,
      use: { ...devices['Pixel 7'] },
    },
    {
      // Real Safari engine, limited to the pages a visitor sees before signing
      // in — which is where a WebKit-only rendering bug would cost the most.
      name: 'mobile-safari',
      dependencies: ['setup'],
      testMatch: /storefront\.spec\.ts/,
      use: { ...devices['iPhone 14'] },
    },
    {
      // Points at the deliberately broken gateway.
      name: 'gateway-outage',
      dependencies: ['setup'],
      testMatch: /gateway-outage\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `http://localhost:${BROKEN_GATEWAY_PORT}`,
      },
    },
  ],

  webServer: [
    {
      command: `npx next start -p ${UNCONFIGURED_PORT}`,
      url: `http://localhost:${UNCONFIGURED_PORT}/api/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      stdout: 'pipe',
      stderr: 'pipe',
      env: baseEnv,
    },
    {
      command: `npx next start -p ${BROKEN_GATEWAY_PORT}`,
      url: `http://localhost:${BROKEN_GATEWAY_PORT}/api/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      stdout: 'pipe',
      stderr: 'pipe',
      env: {
        ...baseEnv,
        // Configured, so Card is offered — but every call fails, which is the
        // whole point. WHISH_ALLOW_SANDBOX keeps the boot assertion happy
        // outside production (see lib/payments/whish-boot.ts).
        WHISH_CHANNEL: 'e2e-invalid-channel',
        WHISH_SECRET: 'e2e-invalid-secret',
        WHISH_ALLOW_SANDBOX: '1',
      },
    },
  ],
});
