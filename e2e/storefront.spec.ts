import { test, expect } from '@playwright/test';
import { PRODUCT, OUT_OF_STOCK_PRODUCT, disconnect } from './support/data';
import { catalogPrice, productRegion } from './support/flows';

test.afterAll(async () => {
  await disconnect();
});

test.describe('Storefront', () => {
  test('lists products and opens a product page', async ({ page }) => {
    await page.goto('/store');

    await expect(page.getByRole('heading', { name: /the workshop store/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: PRODUCT.name, level: 3 })).toBeVisible();

    // The whole card is a single link; click that rather than the heading inside
    // it, which is not the interactive element and does not reliably take a tap.
    await page.getByRole('link', { name: new RegExp(PRODUCT.name, 'i') }).click();
    await expect(page).toHaveURL(new RegExp(`/store/${PRODUCT.slug}$`));
    await expect(page.getByRole('heading', { name: PRODUCT.name, level: 1 })).toBeVisible();
    // Catalogue prices use formatMoneyCompact, so a whole amount has no decimals.
    await expect(
      productRegion(page).getByText(catalogPrice(PRODUCT.price), { exact: false })
    ).toBeVisible();
  });

  test('an out-of-stock product cannot be added to the cart', async ({ page }) => {
    await page.goto(`/store/${OUT_OF_STOCK_PRODUCT.slug}`);
    const button = page.getByRole('button', { name: /out of stock/i });
    await expect(button).toBeVisible();
    await expect(button).toBeDisabled();
  });

  test('a missing product shows the branded 404 and is not indexable', async ({ page }) => {
    const res = await page.goto('/store/this-product-does-not-exist');

    // A streamed notFound() answers 200 by design in this Next version — the
    // response headers are already sent, so the status cannot be changed
    // afterwards. `noindex` in the HTML is what keeps dead product URLs out of
    // search results, so that is the property worth asserting.
    expect(res?.status()).toBe(200);
    // Next injects its own noindex on top of the route's metadata, so there is
    // more than one tag. What matters is that EVERY one is restrictive: the root
    // layout inherits `index, follow` onto every page, and a page shipping both
    // that and a noindex leaves the outcome to each crawler's conflict handling.
    const robots = await page.locator('meta[name="robots"]').evaluateAll((els) =>
      els.map((el) => el.getAttribute('content') ?? '')
    );
    expect(robots.length).toBeGreaterThan(0);
    expect(robots.every((c) => /noindex/.test(c)), `robots tags: ${robots.join(' | ')}`).toBe(
      true
    );

    await expect(page.getByRole('heading', { name: /wrong/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /browse the store/i })).toBeVisible();
  });

  test('an unknown URL shows the branded 404 with a real 404 status', async ({ page }) => {
    // An unmatched route is resolved before rendering begins, so this one can
    // and does answer a true 404.
    const res = await page.goto('/no-such-page');
    expect(res?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: /wrong/i })).toBeVisible();
  });

  test('the cart accumulates items and reflects quantity', async ({ page }) => {
    await page.goto(`/store/${PRODUCT.slug}`);
    const product = productRegion(page);
    await product.getByRole('button', { name: /add to cart/i }).click();
    await expect(product.getByRole('button', { name: /added/i })).toBeVisible();

    await page.goto('/cart');
    await expect(page.getByRole('link', { name: PRODUCT.name })).toBeVisible();
    await expect(page.getByText('1 item', { exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: /proceed to checkout/i })).toBeVisible();
  });

  test('serves the security headers a production deployment needs', async ({ page }) => {
    const res = await page.goto('/');
    const headers = res!.headers();

    expect(headers['content-security-policy']).toBeTruthy();
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('DENY');
    // The framework must not advertise itself.
    expect(headers['x-powered-by']).toBeUndefined();
  });
});
