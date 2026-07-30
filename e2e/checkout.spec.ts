import { test, expect } from '@playwright/test';
import path from 'path';
import { PRODUCT, OUT_OF_STOCK_PRODUCT, findOrderByRef, disconnect } from './support/data';
import {
  addFixtureProductToCart,
  fillCheckoutForm,
  expectedTotals,
  money,
  readOrderRef,
} from './support/flows';

/**
 * The money path.
 *
 * The single most important property here is that **the total the customer is
 * shown is the total they are charged**. That was a real defect: the cart
 * hardcoded 10% tax while the server used the admin-configured rate, so a shop
 * on any other rate displayed one number and charged another.
 *
 * `/checkout` is listed in proxy.ts PROTECTED, so there is no guest checkout —
 * an anonymous visitor is redirected to /signin?redirect=/checkout. Every test
 * here therefore runs as a signed-in customer.
 */
test.use({ storageState: path.join(__dirname, '.auth', 'customer.json') });

test.afterAll(async () => {
  await disconnect();
});

test.describe('Checkout', () => {
  test('shows a total that matches what the server actually records', async ({ page }) => {
    await addFixtureProductToCart(page);

    const { subtotal, tax, total } = expectedTotals(PRODUCT.price);

    await page.goto('/checkout');
    // The summary is rendered from the live admin tax rate passed by the server.
    await expect(page.getByText(money(subtotal), { exact: false }).first()).toBeVisible();
    await expect(page.getByText(`Estimated Tax (10%)`)).toBeVisible();
    await expect(page.getByText(money(total), { exact: false }).first()).toBeVisible();

    await fillCheckoutForm(page);
    await page.getByRole('button', { name: /pay at workshop/i }).click();
    await page.getByRole('button', { name: /place order/i }).click();

    await expect(page).toHaveURL(/\/checkout\/success/);
    const ref = await readOrderRef(page);

    // The database is the authority: assert the STORED totals, not the rendered
    // ones, so a display-only bug cannot make this pass.
    const order = await findOrderByRef(ref);
    expect(order, `order ${ref} should exist`).not.toBeNull();
    expect(Number(order!.subtotal)).toBe(subtotal);
    expect(Number(order!.tax)).toBe(tax);
    expect(Number(order!.total)).toBe(total);
    expect(order!.payment).toBe('shop');
    expect(order!.items).toHaveLength(1);
    expect(order!.items[0].slug).toBe(PRODUCT.slug);
  });

  test('empties the cart after a completed order', async ({ page }) => {
    await addFixtureProductToCart(page);
    await page.goto('/checkout');
    await fillCheckoutForm(page);
    await page.getByRole('button', { name: /pay at workshop/i }).click();
    await page.getByRole('button', { name: /place order/i }).click();

    await expect(page).toHaveURL(/\/checkout\/success/);

    // A cart left populated here is how a customer pays twice.
    await page.goto('/cart');
    await expect(page.getByText(/your cart is empty/i)).toBeVisible();
  });

  test('prices the order from the database, not from the cart the browser sent', async ({
    page,
  }) => {
    await addFixtureProductToCart(page);

    // Tamper with the persisted cart to claim a much lower price, exactly as a
    // customer editing localStorage would.
    await page.goto('/cart');
    await page.evaluate(() => {
      const raw = window.localStorage.getItem('protuning-cart');
      if (!raw) throw new Error('cart not persisted');
      const parsed = JSON.parse(raw);
      parsed.state.items = parsed.state.items.map((i: { price: number }) => ({ ...i, price: 1 }));
      window.localStorage.setItem('protuning-cart', JSON.stringify(parsed));
    });
    await page.reload();

    await page.goto('/checkout');
    await fillCheckoutForm(page);
    await page.getByRole('button', { name: /pay at workshop/i }).click();
    await page.getByRole('button', { name: /place order/i }).click();

    // The server detects that the shown price no longer matches the live price
    // and refuses, rather than charging a number the customer never saw.
    await expect(page.getByText(/price of .* changed|prices changed/i)).toBeVisible();
    await expect(page).not.toHaveURL(/\/checkout\/success/);
  });

  test('refuses an out-of-stock item even if it reaches the cart', async ({ page }) => {
    // The button is disabled in the UI, so put it in the cart directly — this is
    // asserting the SERVER-side guard, which is the only one that counts.
    await page.goto('/');
    await page.evaluate(
      ({ slug, name, price }) => {
        window.localStorage.setItem(
          'protuning-cart',
          JSON.stringify({
            state: {
              items: [
                {
                  id: 'tampered',
                  slug,
                  name,
                  category: 'Exhaust',
                  price,
                  currency: 'USD',
                  quantity: 1,
                  visualColor: '#000000',
                },
              ],
            },
            version: 0,
          })
        );
      },
      OUT_OF_STOCK_PRODUCT
    );

    await page.goto('/checkout');
    await fillCheckoutForm(page);
    await page.getByRole('button', { name: /pay at workshop/i }).click();
    await page.getByRole('button', { name: /place order/i }).click();

    await expect(page.getByText(/no longer available/i)).toBeVisible();
    await expect(page).not.toHaveURL(/\/checkout\/success/);
  });

  test('will not confirm an order that was never placed', async ({ page }) => {
    // Opening the success page directly must not fabricate a reference — it used
    // to invent one under an "Order Confirmed" heading.
    await page.goto('/checkout/success');
    await expect(page.getByText(/no order to show/i)).toBeVisible();
    await expect(page.getByText(/^TUNE-/)).toHaveCount(0);
  });
});
