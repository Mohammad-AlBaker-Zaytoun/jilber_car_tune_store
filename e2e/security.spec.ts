import { test, expect } from '@playwright/test';
import { PRODUCT, disconnect } from './support/data';

/**
 * Controls a buyer will want to see demonstrated, exercised over real HTTP
 * rather than asserted in a unit test.
 */
test.afterAll(async () => {
  await disconnect();
});

test.describe('Security controls', () => {
  test('every admin API rejects an unauthenticated caller', async ({ request }) => {
    for (const endpoint of [
      '/api/admin/orders',
      '/api/admin/users',
      '/api/admin/reviews',
      '/api/admin/products',
      '/api/admin/settings',
      '/api/admin/stats',
      '/api/admin/quotes',
      '/api/admin/inquiries',
    ]) {
      const res = await request.get(endpoint);
      expect([401, 403], `${endpoint} should refuse anonymous access`).toContain(res.status());
    }
  });

  test('a cross-origin state-changing request is blocked', async ({ request }) => {
    const res = await request.post('/api/orders', {
      headers: { Origin: 'https://attacker.example' },
      data: {
        customer: {
          fullName: 'CSRF',
          email: 'e2e-csrf@example.test',
          phone: '+1',
          address: 'x',
        },
        vehicle: { make: 'BMW', model: 'M3', year: '2021' },
        items: [{ slug: PRODUCT.slug, quantity: 1 }],
        payment: 'shop',
      },
    });

    expect(res.status()).toBe(403);
    expect(await res.text()).toMatch(/cross-origin/i);
  });

  test('the payment callback is reachable without an Origin header', async ({ request }) => {
    // A gateway callback is a server-to-server POST with no Origin and no
    // Referer — the exact shape the CSRF gate rejects. This endpoint is
    // explicitly exempt, because it was being answered 403 and so had never
    // once reached its handler.
    const res = await request.post('/api/whish/callback?externalId=999999999&currency=USD');
    expect(res.status()).not.toBe(403);
  });

  // Order creation uses the same rateLimit() primitive (unit-tested in
  // tests/rate-limit.test.ts) but with an env-tunable ceiling, raised for this
  // run so a 429 cannot mask the guards the other specs assert. Its default of
  // 8/minute is what ships. Login throttling below proves the primitive denies
  // over real HTTP.
  test('login is rate limited', async ({ request, baseURL }) => {
    const attempts = await Promise.all(
      Array.from({ length: 12 }, () =>
        request.post('/api/auth/login', {
          headers: { Origin: baseURL! },
          data: { email: 'e2e-ratelimit@example.test', password: 'wrong-password-here' },
        })
      )
    );

    const statuses = attempts.map((r) => r.status());
    expect(statuses, 'brute force should hit a 429').toContain(429);
  });

  test('an order total cannot be dictated by the client', async ({ request, baseURL }) => {
    // Send a deliberately wrong expectedPrice: the server must refuse rather
    // than accept the caller's number.
    const res = await request.post('/api/orders', {
      headers: { Origin: baseURL! },
      data: {
        customer: {
          fullName: 'Price Tamper',
          email: 'e2e-tamper@example.test',
          phone: '+96170000000',
          address: '1 Test Street',
        },
        vehicle: { make: 'BMW', model: 'M3', year: '2021' },
        items: [{ slug: PRODUCT.slug, quantity: 1, expectedPrice: 1 }],
        payment: 'shop',
      },
    });

    expect(res.status()).toBe(409);
    const body = (await res.json()) as { code?: string };
    expect(body.code).toBe('PRICE_CHANGED');
  });

  test('the health endpoint reports the database', async ({ request }) => {
    const res = await request.get('/api/health');
    expect(res.status()).toBe(200);
  });

  test('robots and sitemap are served', async ({ request }) => {
    expect((await request.get('/robots.txt')).status()).toBe(200);
    expect((await request.get('/sitemap.xml')).status()).toBe(200);
  });
});
