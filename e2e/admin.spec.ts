import { test, expect, type Page } from '@playwright/test';
import path from 'path';
import { findOrderByRef, disconnect } from './support/data';
import { catalogPrice, createShopOrder } from './support/flows';

// Every test in this file runs as the admin.
test.use({ storageState: path.join(__dirname, '.auth', 'admin.json') });

test.afterAll(async () => {
  await disconnect();
});

/**
 * The orders list renders as a table from `lg:` up and as a card list below it,
 * and BOTH are in the DOM. This file runs in two projects at two widths, so
 * locators must target the layout the current viewport actually shows —
 * `getByRole('table')` resolves to a display:none element at 412px.
 */
const LG = 1024;

function ordersList(page: Page) {
  const width = page.viewportSize()?.width ?? LG;
  return width >= LG
    ? page.getByRole('table')
    : page.getByRole('list', { name: 'Orders' });
}

test.describe('Admin order management', () => {
  test('the orders table shows the payment method, not only the status', async ({
    page,
    request,
    baseURL,
  }) => {
    const { ref } = await createShopOrder(request, baseURL!);

    // columnheader roles only exist in the wide layout; the phone equivalent of
    // this assertion is the next test, which runs at 360px.
    test.skip(
      (page.viewportSize()?.width ?? LG) < LG,
      'table layout only renders from lg: up — see the phone test below'
    );

    await page.goto('/admin/orders');

    const table = page.getByRole('table');
    await expect(table.getByRole('link', { name: ref })).toBeVisible();

    // The METHOD column was absent, so a card order and a walk-in looked
    // identical from the list — which matters most during a gateway outage.
    await expect(table.getByRole('columnheader', { name: /method/i })).toBeVisible();
    await expect(table.getByRole('columnheader', { name: /^payment$/i })).toBeVisible();
  });

  test('an order is fully readable on a phone, not just its status', async ({
    page,
    request,
    baseURL,
  }) => {
    // The five columns that used to be `hidden md:table-cell` had no mobile
    // equivalent at all, so on a phone an admin could not see what an order was
    // worth or whether it had been paid.
    const { ref } = await createShopOrder(request, baseURL!);
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto('/admin/orders');

    const card = page
      .getByRole('list', { name: 'Orders' })
      .locator('li')
      .filter({ hasText: ref });

    await expect(card).toBeVisible();
    for (const label of ['Total', 'Payment', 'Method', 'Vehicle', 'Items', 'Status']) {
      await expect(card.getByText(label, { exact: true })).toBeVisible();
    }
    // And the money is actually shown, not merely labelled. Asserted against the
    // STORED total rather than a hardcoded figure, so this cannot drift when the
    // fixture quantity or the tax rate changes.
    const stored = await findOrderByRef(ref);
    await expect(card).toContainText(catalogPrice(Number(stored!.total)));
  });

  test('an admin can search for an order by reference', async ({ page, request, baseURL }) => {
    const { ref } = await createShopOrder(request, baseURL!);

    await page.goto('/admin/orders');
    await page.getByPlaceholder(/search ref/i).fill(ref);

    // Search is layout-independent: it happens in SQL and both layouts render the
    // ref as a link, so this asserts against whichever one is on screen.
    await expect(ordersList(page).getByRole('link', { name: ref })).toBeVisible();
    // Searching happens in SQL, so the count reflects the whole table.
    await expect(page.getByText(/^1 order$/)).toBeVisible();
  });

  test('an admin can advance an order through its lifecycle', async ({
    page,
    request,
    baseURL,
  }) => {
    const { orderId, ref } = await createShopOrder(request, baseURL!);

    await page.goto(`/admin/orders/${orderId}`);
    await expect(page.getByText(ref).first()).toBeVisible();

    // Move pending -> confirmed through the real UI.
    await page.getByLabel(/new status/i).selectOption('confirmed');
    await page.getByRole('button', { name: /save|update/i }).first().click();

    await expect(page.getByText(/confirmed/i).first()).toBeVisible();

    const order = await findOrderByRef(ref);
    expect(order!.status).toBe('confirmed');
    // The transition is recorded, so there is an audit trail.
    expect(order!.statusHistory.some((h) => h.toStatus === 'confirmed')).toBe(true);
  });

  test('the dashboard does not count an unpaid card order as revenue', async ({
    page,
    request,
    baseURL,
  }) => {
    // A shop order counts; an unpaid card order must not. This is what stops a
    // gateway-outage capture from inflating the revenue figure.
    const res = await request.get('/api/admin/stats');
    expect(res.ok()).toBe(true);
    const before = (await res.json()) as { estimatedRevenue: number };

    await createShopOrder(request, baseURL!);

    const after = (await (await request.get('/api/admin/stats')).json()) as {
      estimatedRevenue: number;
    };
    // The shop order DOES count, so revenue moves by its total.
    expect(after.estimatedRevenue).toBeGreaterThan(before.estimatedRevenue);

    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: /dashboard/i }).first()).toBeVisible();

    // Assert the RENDERED tile, not just the API number. This test previously
    // checked the endpoint and then only that the page had a heading, so a
    // refactor that broke the tile into a literal code fragment
    // ("{formatMoneyCompact(stats.estimatedRevenue)}") shipped green.
    await expect(page.getByRole('group', { name: /est\. revenue/i })).toContainText(
      catalogPrice(after.estimatedRevenue)
    );
  });

  test('admin lists are paginated rather than returning the whole table', async ({ request }) => {
    const res = await request.get('/api/admin/orders?page=1');
    expect(res.ok()).toBe(true);

    const body = (await res.json()) as {
      orders: unknown[];
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
      statusCounts: Record<string, number>;
    };

    // A page envelope, not a bare array — the endpoint used to return every
    // order with every line item and every history row.
    expect(Array.isArray(body.orders)).toBe(true);
    expect(body.page).toBe(1);
    expect(body.pageSize).toBeLessThanOrEqual(100);
    expect(body.orders.length).toBeLessThanOrEqual(body.pageSize);
    // Counts come from SQL so the stat tiles describe the whole table.
    expect(typeof body.statusCounts.all).toBe('number');
  });
});
