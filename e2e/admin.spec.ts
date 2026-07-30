import { test, expect } from '@playwright/test';
import path from 'path';
import { findOrderByRef, disconnect } from './support/data';
import { catalogPrice, createShopOrder } from './support/flows';

// Every test in this file runs as the admin.
test.use({ storageState: path.join(__dirname, '.auth', 'admin.json') });

test.afterAll(async () => {
  await disconnect();
});

test.describe('Admin order management', () => {
  test('the orders table shows the payment method, not only the status', async ({
    page,
    request,
    baseURL,
  }) => {
    const { ref } = await createShopOrder(request, baseURL!);

    await page.goto('/admin/orders');
    await expect(page.getByRole('link', { name: ref })).toBeVisible();

    // The METHOD column was absent, so a card order and a walk-in looked
    // identical from the list — which matters most during a gateway outage.
    await expect(page.getByRole('columnheader', { name: /method/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /^payment$/i })).toBeVisible();
  });

  test('an admin can search for an order by reference', async ({ page, request, baseURL }) => {
    const { ref } = await createShopOrder(request, baseURL!);

    await page.goto('/admin/orders');
    await page.getByPlaceholder(/search ref/i).fill(ref);

    await expect(page.getByRole('link', { name: ref })).toBeVisible();
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
