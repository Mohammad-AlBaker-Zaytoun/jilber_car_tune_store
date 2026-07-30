import { test, expect, type Page } from '@playwright/test';
import path from 'path';
import { PRODUCT, disconnect } from './support/data';
import { addFixtureProductToCart, createShopOrder, LONG_CUSTOMER } from './support/flows';
import {
  measure,
  visitRoute,
  formatMeasurement,
  persist,
  readAllPersisted,
  TAP_TARGET_MIN,
} from './support/layout';

/**
 * Responsive audit — every route, five widths.
 *
 * WHY THIS EXISTS. `overflow-x` was suppressed on the body, so horizontal
 * overflow was clipped with no scrollbar: content got cut off and manual testing
 * looked fine. Nothing in CI had ever loaded an admin page below 1280px, which is
 * exactly why five admin tables shipped with their Total and Payment columns
 * unreachable on a phone.
 *
 * This FAILS THE BUILD. The summary test at the bottom asserts zero document
 * overflow, zero elements past the viewport, zero content overflowing its own
 * box, and zero tap targets under 24px. Per-route detail is attached to the HTML
 * report either way — `npm run test:e2e:report`.
 */

/** Widths, each chosen for a reason — see docs/E2E-TESTING.md. */
const VIEWPORTS = [
  { width: 320, height: 568, why: 'smallest width still in the field' },
  { width: 360, height: 640, why: 'the modal Android width; nothing else tests it' },
  { width: 412, height: 915, why: "matches devices['Pixel 7'], so findings reproduce" },
  { width: 768, height: 1024, why: 'the band that inherits mobile wholesale' },
  { width: 1024, height: 768, why: 'the lg: boundary where the admin sidebar appears' },
] as const;

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
    // Persisted to disk, not an array: Playwright restarts the worker between
    // describe blocks, so in-memory state gave the summary only the last block's
    // routes while looking like a complete run.
    persist(m);
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

  test('a toast does not cover the WhatsApp and Call buttons on a phone', async ({ page }) => {
    // Toast.tsx and FloatingContactButtonsClient.tsx both used `fixed bottom-6
    // right-6`, so adding to the cart dropped a toast squarely on top of the two
    // contact buttons for its full 3.5s life. Those are a primary conversion path
    // for this business.
    //
    // Hit-tested with elementFromPoint rather than eyeballed: an overlay can be
    // invisible in a screenshot and still swallow the tap.
    await page.setViewportSize({ width: 360, height: 640 });
    await blockHeroFrames(page);
    await addFixtureProductToCart(page);

    // The toast is up now (addFixtureProductToCart waits for "Added"). Filtered by
    // text because Next injects its own empty role="alert" route announcer.
    await expect(
      page.getByRole('alert').filter({ hasText: /added to cart/i })
    ).toBeVisible();

    let checked = 0;
    for (const label of ['Chat on WhatsApp', 'Call us']) {
      const button = page.getByLabel(label);
      if ((await button.count()) === 0) continue; // admin-configurable: 0, 1 or 2
      checked += 1;

      const box = await button.boundingBox();
      expect(box, `${label} should have a box`).not.toBeNull();

      const hit = await page.evaluate(
        ({ x, y }) => {
          const el = document.elementFromPoint(x, y);
          return el ? (el.closest('a,button')?.getAttribute('aria-label') ?? el.tagName) : null;
        },
        { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 }
      );

      expect(hit, `a toast is covering "${label}"`).toBe(label);
    }

    // Without this the test passes vacuously when the fixture settings happen to
    // disable both buttons — proving nothing about the collision it exists to catch.
    expect(checked, 'no contact button was present to hit-test').toBeGreaterThan(0);
  });

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
  // Declared last, and the suite is workers:1 / fullyParallel:false, so every
  // route above has already written its results by the time this reads them.
  test('summary of every route and width', async ({}, testInfo) => {
    const allMeasurements = readAllPersisted();
    expect(allMeasurements.length, 'no measurements were persisted').toBeGreaterThan(0);

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
            .map(
              (t) =>
                `${t.width}x${t.height} <${t.tag} class="${t.classes}"> ${JSON.stringify(t.label)}`
            )
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

    // ---- The gate ----------------------------------------------------------
    // Live now that the fixes have landed. The messages carry the route and the
    // element, so a failure here is directly actionable.
    const brief = (rows: typeof allMeasurements) =>
      rows.map((m) => `${m.route} @ ${m.width}px`).join(', ');

    expect(overflowing, `routes overflow horizontally: ${brief(overflowing)}`).toEqual([]);
    expect(
      withOffenders,
      `elements extend past the viewport: ${brief(withOffenders)}`
    ).toEqual([]);
    expect(
      withContent,
      `content is wider than its own box: ${brief(withContent)}`
    ).toEqual([]);
    expect(
      withTiny,
      `tap targets below ${TAP_TARGET_MIN}px (WCAG 2.2 AA): ${brief(withTiny)}`
    ).toEqual([]);
  });
});
