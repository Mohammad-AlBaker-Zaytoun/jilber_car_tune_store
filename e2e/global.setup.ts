import { test as setup, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { seedE2EData, cleanupE2EData, disconnect, CUSTOMER, ADMIN } from './support/data';
import { clearPersisted } from './support/layout';

const AUTH_DIR = path.join(__dirname, '.auth');

/**
 * One-time setup for the whole run: fixtures, then a saved session per role.
 *
 * Sessions are created through the real POST /api/auth/login rather than by
 * driving the sign-in form, because logging in is not what most tests are about
 * — and the login UI has its own dedicated spec that does exercise the form.
 */
setup('seed fixtures and save authenticated sessions', async ({ request, baseURL }) => {
  // Clean first: a previous run that was interrupted may have left orders whose
  // presence would break "this customer has no orders yet" style assertions.
  await cleanupE2EData();
  await seedE2EData();

  // Drop any responsive measurements from a previous run, so the audit's summary
  // can never mix two runs' numbers together.
  clearPersisted();

  fs.mkdirSync(AUTH_DIR, { recursive: true });

  for (const [user, file] of [
    [CUSTOMER, 'customer.json'],
    [ADMIN, 'admin.json'],
  ] as const) {
    const res = await request.post('/api/auth/login', {
      data: { email: user.email, password: user.password },
      // The API enforces a same-origin check on every mutating request, so the
      // header has to be present here exactly as a browser would send it.
      headers: { Origin: baseURL! },
    });
    expect(res.ok(), `login for ${user.email} failed: ${res.status()} ${await res.text()}`).toBe(
      true
    );
    await request.storageState({ path: path.join(AUTH_DIR, file) });
  }

  await disconnect();
});
