import { test, expect } from '@playwright/test';
import path from 'path';
import { PRODUCT, findOrderByRef, disconnect } from './support/data';
import { addFixtureProductToCart, fillCheckoutForm, readOrderRef } from './support/flows';

/**
 * Orders must survive a payment-gateway outage.
 *
 * This project runs against the server on :4311, which has Whish credentials
 * configured but INVALID — so every call genuinely fails. Nothing is mocked: the
 * failure is real, and no charge can succeed against invalid credentials.
 *
 * The behaviour under test is the one that used to be broken outright. The order
 * row is written before the gateway is called, so a failure previously left a
 * real order that nobody was told about, and an error message that invited the
 * customer to place a duplicate.
 *
 * Runs serially: the circuit breaker is per-process shared state, and the last
 * test deliberately trips it.
 *
 * `/checkout` is behind auth (proxy.ts PROTECTED), so these run signed in.
 */
test.describe.configure({ mode: 'serial' });

test.use({ storageState: path.join(__dirname, '.auth', 'customer.json') });

test.afterAll(async () => {
  await disconnect();
});

test.describe('Payment gateway outage', () => {
  test('offers card payment while the gateway is believed healthy', async ({ page }) => {
    await addFixtureProductToCart(page);
    await page.goto('/checkout');

    // Credentials are present, and the breaker starts closed, so the option is
    // offered. (It is invalid credentials that will fail, not availability.)
    await expect(page.getByRole('button', { name: /card payment/i })).toBeVisible();
  });

  test('captures the order instead of losing it when the gateway fails', async ({ page }) => {
    await addFixtureProductToCart(page);
    await page.goto('/checkout');
    await fillCheckoutForm(page);
    await page.getByRole('button', { name: /card payment/i }).click();
    await page.getByRole('button', { name: /place order/i }).click();

    // The customer lands on success, NOT on an error — the sale is captured.
    await expect(page).toHaveURL(/\/checkout\/success/);

    // And is told plainly that they have not paid.
    await expect(page.getByText(/payment still needed/i)).toBeVisible();
    await expect(page.getByText(/nothing has been charged/i)).toBeVisible();

    const ref = await readOrderRef(page);
    const order = await findOrderByRef(ref);

    expect(order, `order ${ref} should have been saved`).not.toBeNull();
    // Stays a card order: rewriting the method to 'shop' would make an unpaid
    // order count toward estimated revenue.
    expect(order!.payment).toBe('card');
    expect(order!.paymentStatus).toBe('unpaid');
    // No payment session survives, so the reconciliation cron will not chase it.
    expect(order!.whishExternalId).toBeNull();
    // The reason is recorded where an operator will actually see it.
    expect(order!.adminNotes ?? '').toMatch(/online payment unavailable/i);
    expect(
      order!.statusHistory.some((h) =>
        /online card payment could not be started/i.test(h.note ?? '')
      )
    ).toBe(true);

    // Same context as the order above — a cart left populated here is how a
    // customer pays twice for the same work. Asserting this in a separate test
    // would prove nothing: each test starts with a fresh, already-empty cart.
    await page.goto('/cart');
    await expect(page.getByText(/your cart is empty/i)).toBeVisible();
  });

  test('stops offering card payment once the gateway has failed repeatedly', async ({ page }) => {
    // Two more failures take the breaker past its threshold of three.
    for (let i = 0; i < 2; i++) {
      await addFixtureProductToCart(page);
      await page.goto('/checkout');
      await fillCheckoutForm(page);
      await page.getByRole('button', { name: /card payment/i }).click();
      await page.getByRole('button', { name: /place order/i }).click();
      await expect(page).toHaveURL(/\/checkout\/success/);
    }

    // The breaker is now open, so the option disappears rather than sending the
    // next customer down a path that is known to be failing.
    await addFixtureProductToCart(page);
    await page.goto('/checkout');
    await expect(page.getByRole('button', { name: /card payment/i })).toHaveCount(0);

    // Ordering itself must still work — that is the whole point.
    await expect(page.getByRole('button', { name: /pay at workshop/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /bank transfer/i })).toBeVisible();
  });

  test('still takes a workshop order with the gateway down', async ({ page }) => {
    // Fresh context per test, so this needs its own cart.
    await addFixtureProductToCart(page);
    await page.goto('/checkout');
    await fillCheckoutForm(page);
    await page.getByRole('button', { name: /pay at workshop/i }).click();
    await page.getByRole('button', { name: /place order/i }).click();

    await expect(page).toHaveURL(/\/checkout\/success/);
    // A normal confirmation, with no payment warning.
    await expect(page.getByText(/payment still needed/i)).toHaveCount(0);

    const order = await findOrderByRef(await readOrderRef(page));
    expect(order!.payment).toBe('shop');
    expect(order!.items[0].slug).toBe(PRODUCT.slug);
  });

  test('rejects a card order submitted by a stale client while the breaker is open', async ({
    request,
    baseURL,
  }) => {
    // A browser that still has the old page cached could still POST 'card'. It
    // must be refused BEFORE an order is written, so the customer keeps their
    // cart and simply picks another method.
    const res = await request.post('/api/orders', {
      headers: { Origin: baseURL! },
      data: {
        customer: {
          fullName: 'Stale Client',
          email: 'e2e-stale@example.test',
          phone: '+96170000000',
          address: '1 Test Street',
        },
        vehicle: { make: 'BMW', model: 'M3', year: '2021' },
        items: [{ slug: PRODUCT.slug, quantity: 1, expectedPrice: PRODUCT.price }],
        payment: 'card',
      },
    });

    expect(res.status()).toBe(503);
    expect(await res.text()).toMatch(/currently unavailable/i);
  });
});
