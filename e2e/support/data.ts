/**
 * E2E test data.
 *
 * Every fixture this suite creates is prefixed with E2E_PREFIX so it can be
 * identified and removed without touching real rows — the suite runs against the
 * same MSSQL instance as development, and deleting by anything looser than an
 * explicit prefix would eventually delete someone's actual data.
 */

import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';
import { updateSettings } from '@/lib/settings';

export const E2E_PREFIX = 'e2e-';
/** Category the fixture product uses; must exist for product validation to pass. */
export const E2E_CATEGORY = 'Exhaust';

export const CUSTOMER = {
  email: `${E2E_PREFIX}customer@example.test`,
  password: 'E2ePassw0rd!x',
  name: 'E2E Customer',
};

export const ADMIN = {
  email: `${E2E_PREFIX}admin@example.test`,
  password: 'E2eAdminPw0rd!x',
  name: 'E2E Admin',
};

/** A known, in-stock product at a known price, so totals are assertable. */
export const PRODUCT = {
  slug: `${E2E_PREFIX}stage-2-turbo-kit`,
  name: 'E2E Stage 2 Turbo Kit',
  price: 1200,
};

/** An out-of-stock product, to prove the server refuses it. */
export const OUT_OF_STOCK_PRODUCT = {
  slug: `${E2E_PREFIX}discontinued-manifold`,
  name: 'E2E Discontinued Manifold',
  price: 300,
};

/** Fixed so the displayed-vs-charged assertion has an exact expected number. */
export const TAX_RATE = 10;

function productData(p: { slug: string; name: string; price: number }, inStock: boolean) {
  return {
    slug: p.slug,
    name: p.name,
    category: E2E_CATEGORY,
    shortDescription: 'Fixture product created by the E2E suite.',
    description: 'Fixture product created by the E2E suite. Safe to delete.',
    price: p.price,
    currency: 'USD',
    rating: 0,
    reviewCount: 0,
    inStock,
    featured: false,
    visualColor: '#00d4ff',
    visualColor2: '#003d99',
    images: JSON.stringify([]),
    specs: JSON.stringify([{ label: 'Fixture', value: 'yes' }]),
    compatibility: JSON.stringify(['BMW M3']),
    includedItems: JSON.stringify(['Fixture item']),
  };
}

/**
 * Creates everything the suite needs. Idempotent — safe to re-run, and safe to
 * run against a database that already has real products.
 */
export async function seedE2EData(): Promise<void> {
  // The category must exist or POST /api/admin/products rejects the product.
  await prisma.category.upsert({
    where: { slug: E2E_CATEGORY.toLowerCase().replace(/\s+/g, '-') },
    update: {},
    create: {
      id: randomUUID(),
      name: E2E_CATEGORY,
      slug: E2E_CATEGORY.toLowerCase().replace(/\s+/g, '-'),
    },
  });

  for (const [p, inStock] of [
    [PRODUCT, true],
    [OUT_OF_STOCK_PRODUCT, false],
  ] as const) {
    const data = productData(p, inStock);
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: data,
      create: { id: `${E2E_PREFIX}${randomUUID().slice(0, 8)}`, ...data },
    });
  }

  for (const [user, role] of [
    [CUSTOMER, 'user'],
    [ADMIN, 'admin'],
  ] as const) {
    const passwordHash = await bcrypt.hash(user.password, 12);
    await prisma.user.upsert({
      where: { email: user.email },
      // Reset the password and role on every run so a half-finished previous run
      // cannot leave an account the auth fixtures can no longer sign into.
      update: { passwordHash, role, name: user.name, tokenVersion: 0 },
      create: {
        id: randomUUID(),
        email: user.email,
        name: user.name,
        passwordHash,
        role,
        emailVerifiedAt: new Date(),
      },
    });
  }

  // A fixed tax rate makes "the total shown is the total charged" an exact
  // assertion rather than an approximate one. Goes through updateSettings so the
  // row is created with the app's own defaults for every other column.
  await updateSettings({ taxRate: TAX_RATE });
}

/**
 * Removes only rows this suite created.
 *
 * Orders are matched on the fixture customer emails, users and products on the
 * `e2e-` prefix. Nothing here can match a real row unless someone deliberately
 * names their data `e2e-`.
 */
export async function cleanupE2EData(): Promise<void> {
  const orders = await prisma.order.findMany({
    where: {
      OR: [
        { customerEmail: { contains: E2E_PREFIX } },
        { items: { some: { slug: { startsWith: E2E_PREFIX } } } },
      ],
    },
    select: { id: true },
  });
  const orderIds = orders.map((o) => o.id);
  if (orderIds.length) {
    await prisma.orderStatusHistory.deleteMany({ where: { orderId: { in: orderIds } } });
    await prisma.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
    await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
  }

  await prisma.quote.deleteMany({ where: { customerEmail: { contains: E2E_PREFIX } } });
  await prisma.contactInquiry.deleteMany({ where: { email: { contains: E2E_PREFIX } } });
  await prisma.review.deleteMany({ where: { productSlug: { startsWith: E2E_PREFIX } } });
  await prisma.product.deleteMany({ where: { slug: { startsWith: E2E_PREFIX } } });

  const users = await prisma.user.findMany({
    where: { email: { contains: E2E_PREFIX } },
    select: { id: true },
  });
  const userIds = users.map((u) => u.id);
  if (userIds.length) {
    await prisma.passwordResetToken.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.emailVerificationToken.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  }
}

/** Reads an order back for assertions the UI cannot make (admin notes, history). */
export async function findOrderByRef(ref: string) {
  return prisma.order.findUnique({
    where: { ref },
    include: { items: true, statusHistory: true },
  });
}

export async function disconnect(): Promise<void> {
  await prisma.$disconnect();
}
