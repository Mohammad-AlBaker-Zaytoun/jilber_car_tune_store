import { test, expect } from '@playwright/test';
import path from 'path';
import { randomUUID } from 'crypto';
import { CUSTOMER, ADMIN, E2E_PREFIX, disconnect } from './support/data';

test.afterAll(async () => {
  await disconnect();
});

test.describe('Authentication', () => {
  test('a customer can sign in through the form', async ({ page }) => {
    await page.goto('/signin');
    await page.getByLabel(/^email/i).fill(CUSTOMER.email);
    await page.getByLabel(/^password/i).fill(CUSTOMER.password);
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/account/);
    await expect(page.getByText(CUSTOMER.name).first()).toBeVisible();
  });

  test('a wrong password is rejected without revealing whether the account exists', async ({
    page,
  }) => {
    await page.goto('/signin');
    await page.getByLabel(/^email/i).fill(CUSTOMER.email);
    await page.getByLabel(/^password/i).fill('definitely-the-wrong-password');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Same message for a wrong password as for an unknown address.
    await expect(page.getByText(/invalid email or password/i)).toBeVisible();
    await expect(page).toHaveURL(/\/signin/);
  });

  test('an unknown account gets the identical message', async ({ page }) => {
    await page.goto('/signin');
    await page.getByLabel(/^email/i).fill(`${E2E_PREFIX}nobody-${randomUUID()}@example.test`);
    await page.getByLabel(/^password/i).fill('whatever-Password1');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.getByText(/invalid email or password/i)).toBeVisible();
  });

  test('registration does not reveal that an address is already taken', async ({
    request,
    baseURL,
  }) => {
    // Both a brand-new address and an existing one must answer identically —
    // status AND body — or the endpoint is an account-enumeration oracle.
    const fresh = `${E2E_PREFIX}new-${randomUUID()}@example.test`;
    const payload = (email: string) => ({
      name: 'E2E Register Probe',
      email,
      password: 'E2eRegisterPw1!',
      confirmPassword: 'E2eRegisterPw1!',
      terms: true,
    });

    const a = await request.post('/api/auth/register', {
      headers: { Origin: baseURL! },
      data: payload(fresh),
    });
    const b = await request.post('/api/auth/register', {
      headers: { Origin: baseURL! },
      data: payload(CUSTOMER.email),
    });

    expect(a.status()).toBe(b.status());
    expect(await a.json()).toEqual(await b.json());
  });

  test('protected pages redirect an anonymous visitor to sign in', async ({ page }) => {
    await page.goto('/account/orders');
    await expect(page).toHaveURL(/\/signin/);
  });

  test('the admin area is closed to a signed-in customer', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: path.join(__dirname, '.auth', 'customer.json'),
    });
    const page = await context.newPage();

    await page.goto('/admin');
    // Bounced to the account area, never shown the dashboard.
    await expect(page).toHaveURL(/\/account/);

    await context.close();
  });

  test('the admin area opens for an admin', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: path.join(__dirname, '.auth', 'admin.json'),
    });
    const page = await context.newPage();

    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.getByRole('heading', { name: /dashboard/i }).first()).toBeVisible();

    await context.close();
  });

  test('signing out ends the session', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: path.join(__dirname, '.auth', 'customer.json'),
    });
    const page = await context.newPage();

    await page.goto('/account');
    await expect(page).toHaveURL(/\/account/);

    // Click the real control rather than POSTing the endpoint. A raw
    // page.request call races the sliding-session cookie the proxy re-issues on
    // every authenticated page hit, and it skips the button a customer actually
    // uses.
    await page.getByRole('button', { name: /sign out/i }).click();

    // Assert the invariant itself — the session cookie is gone — rather than
    // inferring it from where the browser happened to navigate. Waiting on a URL
    // raced signOut()'s own router.push('/') and made this intermittent, while
    // proving less: a cookie that survived logout is the actual defect worth
    // catching, and expect.poll still catches it because it retries to a timeout.
    await expect
      .poll(async () => (await context.cookies()).some((c) => c.name === 'jilber-session'), {
        message: 'the session cookie should be cleared by signing out',
      })
      .toBe(false);

    // ...and the consequence: a protected page is no longer reachable.
    await page.goto('/account/orders');
    await expect(page).toHaveURL(/\/signin/);

    await context.close();
  });

  test.describe('order privacy', () => {
    test('a customer cannot read an order that is not theirs', async ({ browser, baseURL }) => {
      // Create an order owned by the ADMIN account...
      const adminContext = await browser.newContext({
        storageState: path.join(__dirname, '.auth', 'admin.json'),
      });
      const adminPage = await adminContext.newPage();
      const created = await adminPage.request.post('/api/orders', {
        headers: { Origin: baseURL! },
        data: {
          customer: {
            fullName: ADMIN.name,
            email: ADMIN.email,
            phone: '+96170000000',
            address: '1 Admin Street',
          },
          vehicle: { make: 'BMW', model: 'M5', year: '2022' },
          items: [{ slug: `${E2E_PREFIX}stage-2-turbo-kit`, quantity: 1 }],
          payment: 'shop',
        },
      });
      expect(created.ok()).toBe(true);
      const { orderId } = (await created.json()) as { orderId: string };
      await adminContext.close();

      // ...then try to read it as the customer.
      const customerContext = await browser.newContext({
        storageState: path.join(__dirname, '.auth', 'customer.json'),
      });
      const res = await customerContext.request.get(`/api/account/orders/${orderId}`);

      // 404 rather than 403: the response must not confirm the order exists.
      expect(res.status()).toBe(404);
      await customerContext.close();
    });
  });
});
