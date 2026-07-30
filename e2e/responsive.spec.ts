import { test, expect, type Page } from '@playwright/test';
import path from 'path';
import { PRODUCT, disconnect } from './support/data';
import { addFixtureProductToCart, createShopOrder, LONG_CUSTOMER } from './support/flows';
import {
  measure,
  visitRoute,
  formatMeasurement,
  TAP_TARGET_MIN,
  type RouteMeasurement,
} from './support/layout';

/**
 * Responsive audit — every route, five widths.
 *
 * WHY THIS EXISTS. `overflow-x: hidden` is declared on the body, so horizontal
 * overflow has always been clipped with no scrollbar: content gets cut off and
 * manual testing looks fine. Nothing in CI had ever loaded an admin page below
 * 1280px, which is exactly why five admin tables shipped with their Total and
 * Payment columns unreachable on a phone.
 *
 * REPORT-ONLY FOR NOW. Everything except the viewport meta tag is attached to the
 * HTML report rather than asserted, so this first run is evidence rather than a
 * wall of red. `npm run test:e2e:report` to read it. Once the fixes land, the
 * assertions at the bottom of this file are switched on.
 */

/** Widths, each chosen for a reason — see docs/E2E-TESTING.md. */
const VIEWPORTS = [
  { width: 320, height: 568, why: 'smallest width still in the field' },
  { width: 360, height: 640, why: 'the modal Android width; nothing else tests it' },
  { width: 412, height: 915, why: "matches devices['Pixel 7'], so findings reproduce" },
  { width: 768, height: 1024, why: 'the band that inherits mobile wholesale' },
  { width: 1024, height: 768, why: 'the lg: boundary where the admin sidebar appears' },
] as const;

/** Collected across every test so the last one can print a summary. */
const allMeasurements: RouteMeasurement[] = [];

test.afterAll(async () => {
  await disconnect();
});

/**
 * Aborts the scroll-frame image sequences: 241 JPEGs on `/` and 96 WebPs on
 * `/store`, ~44MB per page load.
 *
 * Safe because the frames paint into an `absolute inset-0` canvas that cannot
 * affect layout, and ScrollFrameSequence wires `img.onerror` to the same handler
 * as `onload`, so the loading overlay still clears.
 */
async function blockHeroFrames(page: Page): Promise<void> {
  for (const pattern of ['**/scroll-frames/**', '**/store-hero-frames/**']) {
    await page.route(pattern, (route) => route.abort());
  }
}

/** Visits one route at every viewport and attaches the findings. */
async function auditRoute(page: Page, route: string, testInfo: import('@playwright/test').TestInfo) {
  const blocks: string[] = [];

  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await visitRoute(page, route);
    const m = await measure(page, route);
    allMeasurements.push(m);
    blocks.push(formatMeasurement(m));
  }

  await testInfo.attach(`responsive ${route}`, {
    body: blocks.join('\n\n'),
    contentType: 'text/plain',
  });
}

/** Builds one `test()` per route, so a failure names the page in the report. */
function auditRoutes(routes: string[]) {
  for (const route of routes) {
    test(`layout: ${route}`, async ({ page }, testInfo) => {
      await blockHeroFrames(page);
      await auditRoute(page, route, testInfo);
    });
  }
}

// ---------------------------------------------------------------------------

test.describe('Responsive audit — public pages', () => {
  auditRoutes([
    '/',
    '/store',
    `/store/${PRODUCT.slug}`,
    '/cart',
    '/quote',
    '/contact',
    '/signin',
    '/signup',
    '/forgot-password',
    '/privacy-policy',
    '/terms-of-service',
    '/cookie-policy',
    '/no-such-page',
    '/store/this-product-does-not-exist',
  ]);

  test('the viewport meta tag opts into device width', async ({ page }) => {
    // The one hard assertion from day one: every measurement in this file is
    // meaningless if the page stops scaling to the device. app/layout.tsx exports
    // a partial `viewport` object, and Next merges it over its own default — so
    // this passes today, and this test is what stops someone "tidying up" that
    // export and silently breaking every phone.
    await page.goto('/');
    await expect(page.locator('meta[name="viewport"]')).toHaveAttribute(
      'content',
      /width=device-width/
    );
  });
});

test.describe('Responsive audit — customer pages', () => {
  test.use({ storageState: path.join(__dirname, '.auth', 'customer.json') });

  // /checkout redirects to /cart when the cart is empty, so it needs an item.
  test('layout: /checkout', async ({ page }, testInfo) => {
    await blockHeroFrames(page);
    await addFixtureProductToCart(page);
    await auditRoute(page, '/checkout', testInfo);
  });

  auditRoutes([
    '/account',
    '/account/profile',
    '/account/orders',
    '/account/quotes',
    '/checkout/success',
    '/checkout/failure',
  ]);
});

test.describe('Responsive audit — admin pages', () => {
  test.use({ storageState: path.join(__dirname, '.auth', 'admin.json') });

  auditRoutes([
    '/admin',
    '/admin/orders',
    '/admin/products',
    '/admin/products/new',
    '/admin/categories',
    '/admin/quotes',
    '/admin/reviews',
    '/admin/users',
    '/admin/inquiries',
    '/admin/settings',
  ]);

  // The detail routes need a real id, so they are built rather than listed.
  test('layout: /admin/orders/[id]', async ({ page, request, baseURL }, testInfo) => {
    await blockHeroFrames(page);
    // LONG_CUSTOMER deliberately: with the tidy fixture this page measures clean,
    // which is exactly how a 240px overflow stayed hidden.
    const { orderId } = await createShopOrder(request, baseURL!, LONG_CUSTOMER);
    await auditRoute(page, `/admin/orders/${orderId}`, testInfo);
  });

  test('layout: /admin/products/[slug]/edit', async ({ page }, testInfo) => {
    await blockHeroFrames(page);
    await auditRoute(page, `/admin/products/${PRODUCT.slug}/edit`, testInfo);
  });
});

test.describe('Responsive audit — summary', () => {
  // Runs last within the file, so `allMeasurements` is populated. Ordering holds
  // because the suite is workers:1 / fullyParallel:false.
  test('summary of every route and width', async ({}, testInfo) => {
    const overflowing = allMeasurements.filter((m) => m.documentOverflows);
    const withOffenders = allMeasurements.filter((m) => m.offenders.length > 0);
    const withContent = allMeasurements.filter((m) => m.contentOverflows.length > 0);
    const withTiny = allMeasurements.filter((m) => m.tinyTargets.length > 0);

    const lines = [
      `Measured ${allMeasurements.length} route/width combinations.`,
      ``,
      `Document-level horizontal overflow: ${overflowing.length}`,
      ...overflowing.map(
        (m) => `  ${m.route} @ ${m.width}px  +${m.scrollWidth - m.width}px`
      ),
      ``,
      `Route/widths with element(s) past the right edge: ${withOffenders.length}`,
      ...withOffenders.map(
        (m) =>
          `  ${m.route} @ ${m.width}px  ${m.offenders.length} offender(s), worst +${m.offenders[0].overflowPx}px  <${m.offenders[0].tag} class="${m.offenders[0].classes}">`
      ),
      ``,
      `Route/widths with content wider than its own box: ${withContent.length}`,
      ...withContent.map(
        (m) =>
          `  ${m.route} @ ${m.width}px  worst +${m.contentOverflows[0].overflowPx}px  <${m.contentOverflows[0].tag} class="${m.contentOverflows[0].classes}">  ${JSON.stringify(m.contentOverflows[0].text)}`
      ),
      ``,
      `Route/widths with a tap target under ${TAP_TARGET_MIN}px: ${withTiny.length}`,
      ...withTiny.map(
        (m) =>
          `  ${m.route} @ ${m.width}px  ${m.tinyTargets
            .map((t) => `${t.width}x${t.height} ${JSON.stringify(t.label)}`)
            .join(', ')}`
      ),
    ];

    const report = lines.join('\n');
    await testInfo.attach('responsive-summary', {
      body: report,
      contentType: 'text/plain',
    });
    // Printed as well as attached: this is the artefact the fix list comes from.
    console.log(`\n${report}\n`);

    // ---- Assertions, switched on once the fixes land (Phase 6) --------------
    // expect(overflowing, 'no route may overflow horizontally').toEqual([]);
    // expect(withOffenders, 'no element may extend past the viewport').toEqual([]);
    // expect(withContent, 'no content may overflow its own box').toEqual([]);
    // expect(withTiny, `no tap target below ${TAP_TARGET_MIN}px`).toEqual([]);
  });
});
