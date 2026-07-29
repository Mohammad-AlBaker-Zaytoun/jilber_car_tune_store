import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/db/prisma';
import {
  createOrder,
  getOrderById,
  markOrderPaidByWhish,
  updateOrderStatus,
  attachWhishExternalId,
  getUnconfirmedWhishOrders,
} from '@/lib/orders';
import { getProductsBySlugs, deleteProduct, createProduct } from '@/lib/products';
import { claimQuoteForConversion } from '@/lib/quotes';
import { updateSettings, getSettings } from '@/lib/settings';

/**
 * Data-layer integration tests — require a real MSSQL database.
 *
 * These exist because the unit suite covers only pure functions, so the WRITE
 * path had no automated coverage at all: transactions, nested creates, the
 * conditional `updateMany` guards that make payment settlement and status
 * transitions safe under concurrency, and Decimal/BigInt round-tripping.
 *
 * That gap became urgent with the Prisma 7 migration, which replaces the built-in
 * engine with a driver adapter — docs/prisma-7-upgrade-plan.md calls the MSSQL
 * connector under v7's query compiler "the riskiest area for this repo".
 *
 * Run with:  npm run test:integration   (needs DATABASE_URL)
 * Excluded from the default `npm test` so the unit suite stays DB-free.
 */

const TAG = `itest-${randomUUID().slice(0, 8)}`;
const createdOrderIds: string[] = [];
const createdProductSlugs: string[] = [];
const createdQuoteIds: string[] = [];

function orderInput(over: Partial<Parameters<typeof createOrder>[0]> = {}) {
  return {
    ref: `${TAG}-${randomUUID().slice(0, 6)}`.toUpperCase(),
    customer: {
      fullName: 'Integration Test',
      email: 'itest@example.com',
      phone: '+10000000000',
      address: '1 Test Way',
    },
    vehicle: {
      make: 'BMW',
      model: 'M3',
      year: '2021',
      engine: 'S58',
      currentMods: '',
      serviceDate: '',
    },
    items: [
      {
        id: 'p-int-1',
        slug: 'int-part',
        name: 'Integration Part',
        category: 'Exhaust',
        price: 199.99,
        currency: 'USD',
        quantity: 2,
        visualColor: '#000000',
      },
    ],
    payment: 'card' as const,
    paymentStatus: 'unpaid' as const,
    subtotal: 399.98,
    tax: 40.0,
    total: 439.98,
    currency: 'USD',
    initialHistoryEntry: {
      fromStatus: null,
      toStatus: 'pending' as const,
      changedByUserId: 'guest',
      changedByName: 'Integration Test',
      note: 'created by integration test',
      createdAt: new Date().toISOString(),
    },
    ...over,
  };
}

beforeAll(async () => {
  // Fail loudly rather than silently passing against nothing.
  await prisma.$queryRaw`SELECT 1`;
});

afterAll(async () => {
  for (const id of createdOrderIds) {
    await prisma.orderStatusHistory.deleteMany({ where: { orderId: id } }).catch(() => {});
    await prisma.orderItem.deleteMany({ where: { orderId: id } }).catch(() => {});
    await prisma.order.deleteMany({ where: { id } }).catch(() => {});
  }
  for (const slug of createdProductSlugs) {
    await prisma.product.deleteMany({ where: { slug } }).catch(() => {});
  }
  for (const id of createdQuoteIds) {
    await prisma.quote.deleteMany({ where: { id } }).catch(() => {});
  }
  await prisma.$disconnect();
});

describe('order creation (nested writes, Decimal round-trip)', () => {
  it('creates an order with its items and initial history in one write', async () => {
    const order = await createOrder(orderInput());
    createdOrderIds.push(order.id);

    const read = await getOrderById(order.id);
    expect(read).not.toBeNull();
    expect(read!.items).toHaveLength(1);
    expect(read!.statusHistory).toHaveLength(1);
    expect(read!.status).toBe('pending');
  });

  it('round-trips Decimal money without precision loss', async () => {
    const order = await createOrder(orderInput());
    createdOrderIds.push(order.id);

    const read = await getOrderById(order.id);
    // Decimal(10,2) through the driver adapter must come back as exact numbers,
    // not floats with dust or strings.
    expect(read!.subtotal).toBe(399.98);
    expect(read!.tax).toBe(40);
    expect(read!.total).toBe(439.98);
    expect(read!.items[0].price).toBe(199.99);
    expect(typeof read!.total).toBe('number');
  });
});

describe('payment settlement is atomic', () => {
  it('marks paid exactly once under a concurrent double callback', async () => {
    const order = await createOrder(orderInput());
    createdOrderIds.push(order.id);

    // Whish delivers both a server callback and a browser redirect; both can
    // land at once. Exactly one must observe the transition, or the customer
    // gets two confirmation emails.
    const [a, b] = await Promise.all([
      markOrderPaidByWhish(order.id, 'txn-1'),
      markOrderPaidByWhish(order.id, 'txn-2'),
    ]);

    const outcomes = [a, b].sort();
    expect(outcomes).toEqual(['already_paid', 'paid_now']);

    const read = await getOrderById(order.id);
    expect(read!.paymentStatus).toBe('paid');
  });

  it('reports a missing order rather than throwing', async () => {
    expect(await markOrderPaidByWhish(randomUUID())).toBe('missing');
  });
});

describe('status transitions are guarded', () => {
  it('lets only one of two concurrent transitions win', async () => {
    const order = await createOrder(orderInput());
    createdOrderIds.push(order.id);

    const actor = { userId: 'admin-1', name: 'Admin' };
    const [a, b] = await Promise.all([
      updateOrderStatus(order.id, 'confirmed', actor),
      updateOrderStatus(order.id, 'cancelled', actor),
    ]);

    // Exactly one succeeds; the loser matches zero rows and returns null.
    const winners = [a, b].filter(Boolean);
    expect(winners).toHaveLength(1);

    const read = await getOrderById(order.id);
    expect(['confirmed', 'cancelled']).toContain(read!.status);
    // One initial entry + exactly one transition — not two.
    expect(read!.statusHistory).toHaveLength(2);
  });
});

describe('BigInt whishExternalId correlation', () => {
  it('stores and finds an order by its externalId', async () => {
    const order = await createOrder(orderInput());
    createdOrderIds.push(order.id);

    const externalId = Number(String(Date.now()).slice(-9));
    await attachWhishExternalId(order.id, externalId);

    const read = await getOrderById(order.id);
    expect(read!.whishExternalId).toBe(externalId);

    // The reconciliation query must see it (created "now", so use a 0ms window).
    const unconfirmed = await getUnconfirmedWhishOrders(0);
    expect(unconfirmed.some((o) => o.id === order.id)).toBe(true);
  });
});

describe('quote conversion claim is atomic', () => {
  it('lets only one concurrent claim succeed', async () => {
    const id = randomUUID();
    createdQuoteIds.push(id);
    await prisma.quote.create({
      data: {
        id,
        quoteNumber: `${TAG}-Q`.toUpperCase(),
        customerName: 'Integration Test',
        customerEmail: 'itest@example.com',
        customerPhone: '+10000000000',
        preferredContactMethod: 'email',
        vehicleMake: 'BMW',
        vehicleModel: 'M3',
        vehicleYear: '2021',
        vehicleEngine: 'S58',
        serviceCategory: 'Exhaust',
        message: 'integration test',
        attachments: '[]',
      },
    });

    const [a, b] = await Promise.all([
      claimQuoteForConversion(id, randomUUID()),
      claimQuoteForConversion(id, randomUUID()),
    ]);
    expect([a, b].filter(Boolean)).toHaveLength(1);
  });
});

describe('product reads and cascade delete', () => {
  it('resolves many products in one query', async () => {
    const slug = `${TAG}-part`;
    createdProductSlugs.push(slug);
    await createProduct({
      slug,
      name: 'Integration Part',
      category: 'Exhaust',
      shortDescription: 's',
      description: 'd',
      price: 100,
      currency: 'USD',
      rating: 0,
      reviewCount: 0,
      inStock: true,
      featured: false,
      visualColor: '#000',
      visualColor2: '#111',
      images: ['/a.jpg'],
      specs: [{ label: 'L', value: 'V' }],
      compatibility: ['BMW M3'],
      includedItems: ['bolt'],
    });

    const map = await getProductsBySlugs([slug, 'does-not-exist']);
    expect(map.get(slug)?.name).toBe('Integration Part');
    // JSON string columns must survive the round trip as arrays.
    expect(map.get(slug)?.compatibility).toEqual(['BMW M3']);
    expect(map.get(slug)?.specs).toEqual([{ label: 'L', value: 'V' }]);
    expect(map.has('does-not-exist')).toBe(false);
  });

  it('deletes a product and its reviews together', async () => {
    const slug = `${TAG}-del`;
    const product = await createProduct({
      slug,
      name: 'To Delete',
      category: 'Exhaust',
      shortDescription: 's',
      description: 'd',
      price: 10,
      currency: 'USD',
      rating: 0,
      reviewCount: 0,
      inStock: true,
      featured: false,
      visualColor: '#000',
      visualColor2: '#111',
      images: [],
      specs: [],
      compatibility: [],
      includedItems: [],
    });

    await prisma.review.create({
      data: {
        id: randomUUID(),
        productId: product.id,
        productSlug: slug,
        userId: randomUUID(),
        userName: 'Tester',
        userEmail: 'itest@example.com',
        rating: 5,
        status: 'approved',
      },
    });

    expect(await deleteProduct(slug)).toBe(true);
    // The $transaction must have taken the reviews with it.
    expect(await prisma.review.count({ where: { productId: product.id } })).toBe(0);
  });
});

describe('settings upsert', () => {
  it('writes and reads back the tax rate', async () => {
    const before = await getSettings();
    try {
      await updateSettings({ taxRate: 12.5 });
      expect((await getSettings()).taxRate).toBe(12.5);
    } finally {
      await updateSettings({ taxRate: before.taxRate });
    }
  });
});
