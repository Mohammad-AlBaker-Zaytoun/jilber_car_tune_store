import { expect, type APIRequestContext, type Page } from '@playwright/test';
import { PRODUCT, TAX_RATE } from './data';

/**
 * Shared journey steps.
 *
 * Kept as plain functions rather than page objects: these are whole *journeys*
 * ("get a product into the cart"), not per-page wrappers, and the specs read
 * better for a non-engineer watching them run.
 */

/**
 * Mirrors formatMoney in lib/currency.ts — always 2dp. Used wherever the app
 * renders a transaction amount (cart, checkout, order records).
 *
 * Deliberately re-implemented rather than imported: if a refactor changed
 * lib/currency.ts, importing it would change the expected value in lockstep and
 * the assertion would keep passing. These are the numbers a customer is
 * charged, so the test states them independently.
 */
export function money(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

/** Mirrors formatMoneyCompact — drops the decimals on a whole amount. Used for
 *  catalogue prices on the store listing and product page. */
export function catalogPrice(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * The product's own detail region, excluding "Related Products".
 *
 * Each related-product card renders its own "Add to cart", so an unscoped
 * `getByRole('button', {name: /add to cart/i})` matches three elements and
 * fails Playwright's strict mode. Scoping by the region the <h1> labels is
 * stable against layout changes in a way DOM order or `.first()` is not.
 */
export function productRegion(page: Page, name: string = PRODUCT.name) {
  return page.getByRole('region', { name });
}

/** subtotal -> {tax, total}, mirroring lib/currency.ts computeTotals. */
export function expectedTotals(subtotal: number) {
  const tax = Math.round(subtotal * (TAX_RATE / 100) * 100) / 100;
  return { subtotal, tax, total: Math.round((subtotal + tax) * 100) / 100 };
}

/** Adds the fixture product to the cart from its detail page. */
export async function addFixtureProductToCart(page: Page, quantity = 1): Promise<void> {
  await page.goto(`/store/${PRODUCT.slug}`);
  await expect(page.getByRole('heading', { name: PRODUCT.name, level: 1 })).toBeVisible();

  const product = productRegion(page);
  const addToCart = product.getByRole('button', { name: /add to cart/i });

  for (let i = 0; i < quantity; i++) {
    await addToCart.click();
    // The button flips to "Added" for ~1.8s; wait for it to settle before a
    // second click, otherwise the clicks race the state change.
    await expect(product.getByRole('button', { name: /added/i })).toBeVisible();
    await expect(addToCart).toBeVisible();
  }
}

/** Fills the checkout contact + vehicle fields. */
export async function fillCheckoutForm(
  page: Page,
  over: Partial<Record<'fullName' | 'email' | 'phone' | 'address' | 'carMake' | 'carModel' | 'carYear', string>> = {}
): Promise<void> {
  const values = {
    fullName: 'E2E Buyer',
    email: 'e2e-buyer@example.test',
    phone: '+96170000000',
    address: '1 Test Street, Beirut',
    carMake: 'BMW',
    carModel: 'M3',
    carYear: '2021',
    ...over,
  };

  await page.getByLabel('Full Name').fill(values.fullName);
  await page.getByLabel(/^email/i).fill(values.email);
  await page.getByLabel('Phone').fill(values.phone);
  await page.getByLabel('Address').fill(values.address);
  await page.getByLabel('Car Make').fill(values.carMake);
  await page.getByLabel('Car Model').fill(values.carModel);
  await page.getByLabel('Year').fill(values.carYear);
}

/**
 * Realistically long customer details, for layout tests.
 *
 * The short-and-tidy fixture below ("1 Test Street") is what let a genuine
 * overflow bug hide: an unbreakable 30-character email fits, a real one does not.
 * With these values the admin order page is 240px wider than a 360px phone.
 * Lebanese-format address and a hyphenated name, because that is the actual
 * market.
 */
export const LONG_CUSTOMER = {
  fullName: 'Abdul-Rahman Al-Khoury Bou Saab',
  email: 'e2e-abdulrahman.alkhoury.bousaab@verylongcompanydomain.example.test',
  phone: '+961 70 123 456',
  address:
    'Rue Charles Malek, Immeuble Saifi 4, Bloc B, 3rd Floor, Achrafieh, Beirut 1100, Lebanon',
};

/**
 * Places a paid-at-workshop order over the API, for tests that need an order to
 * exist without walking the checkout UI again.
 *
 * The customer email carries E2E_PREFIX, so cleanupE2EData() reclaims it.
 * Pass `LONG_CUSTOMER` when the test is about layout rather than behaviour.
 */
export async function createShopOrder(
  request: APIRequestContext,
  baseURL: string,
  customer: typeof LONG_CUSTOMER = {
    fullName: 'E2E Admin Fixture',
    email: 'e2e-admin-fixture@example.test',
    phone: '+96170000000',
    address: '1 Test Street',
  }
): Promise<{ orderId: string; ref: string }> {
  const res = await request.post('/api/orders', {
    headers: { Origin: baseURL },
    data: {
      customer,
      vehicle: { make: 'Mercedes-Benz', model: 'C63 AMG Coupe', year: '2021' },
      items: [{ slug: PRODUCT.slug, quantity: 2, expectedPrice: PRODUCT.price }],
      payment: 'shop',
    },
  });
  expect(res.ok(), `order creation failed: ${res.status()}`).toBe(true);
  return (await res.json()) as { orderId: string; ref: string };
}

/** Reads the order reference off the success page. */
export async function readOrderRef(page: Page): Promise<string> {
  const ref = page.locator('p', { hasText: /^TUNE-\d{8}-[A-Z0-9]{5}$/ }).first();
  await expect(ref).toBeVisible();
  return (await ref.innerText()).trim();
}
