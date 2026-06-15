/**
 * Seed / migration importer.
 *
 * Imports the legacy JSON dev-stores (.dev-*.json, archived under sample_docs/)
 * into MSSQL. Falls back to the static seed in data/products.ts for products and
 * categories when those JSON files are absent. Idempotent: re-running upserts by
 * natural key and never duplicates rows.
 *
 *   npx prisma db seed
 */

import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { PrismaClient } from '@prisma/client';
import { products as staticProducts, CATEGORIES } from '../data/products';

const prisma = new PrismaClient();
const SAMPLE_DIR = path.join(process.cwd(), 'sample_docs');

function readJson<T>(file: string): T | null {
  const p = path.join(SAMPLE_DIR, file);
  try {
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, 'utf-8')) as T;
  } catch (e) {
    console.warn(`! could not parse ${file}:`, e);
    return null;
  }
}

function toDate(v: unknown): Date {
  return v ? new Date(v as string) : new Date();
}
function toDateOpt(v: unknown): Date | null {
  return v ? new Date(v as string) : null;
}

// ---------------------------------------------------------------------------

async function seedCategories() {
  type Cat = { id: string; name: string; slug: string; description?: string; createdAt?: string };
  const json = readJson<Cat[]>('.dev-categories.json');
  const cats: Cat[] =
    json && json.length
      ? json
      : CATEGORIES.map((name) => ({
          id: randomUUID(),
          name,
          slug: name.toLowerCase().replace(/\s+/g, '-'),
          createdAt: new Date().toISOString(),
        }));

  for (const c of cats) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      create: {
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description ?? null,
        createdAt: toDate(c.createdAt),
      },
      update: { name: c.name, description: c.description ?? null },
    });
  }
  console.log(`✓ categories: ${cats.length}`);
}

async function seedProducts() {
  type P = (typeof staticProducts)[number];
  const json = readJson<P[]>('.dev-products.json');
  const prods: P[] = json && json.length ? json : staticProducts;

  for (const p of prods) {
    const data = {
      id: p.id,
      slug: p.slug,
      name: p.name,
      category: p.category,
      shortDescription: p.shortDescription,
      description: p.description,
      price: p.price,
      oldPrice: p.oldPrice ?? null,
      currency: p.currency,
      badge: p.badge ?? null,
      rating: p.rating,
      reviewCount: p.reviewCount,
      inStock: p.inStock,
      featured: p.featured,
      visualColor: p.visualColor,
      visualColor2: p.visualColor2,
      specs: JSON.stringify(p.specs ?? []),
      compatibility: JSON.stringify(p.compatibility ?? []),
      includedItems: JSON.stringify(p.includedItems ?? []),
      images: JSON.stringify(p.images ?? []),
    };
    await prisma.product.upsert({ where: { slug: p.slug }, create: data, update: data });
  }
  console.log(`✓ products: ${prods.length}`);
}

async function seedUsers() {
  type U = {
    id: string;
    email: string;
    name: string;
    phone?: string;
    passwordHash: string;
    role?: string;
    createdAt?: string;
  };
  const users = readJson<U[]>('.dev-users.json') ?? [];
  for (const u of users) {
    const email = u.email.toLowerCase();
    await prisma.user.upsert({
      where: { email },
      create: {
        id: u.id,
        email,
        name: u.name,
        phone: u.phone ?? null,
        passwordHash: u.passwordHash,
        role: u.role ?? 'user',
        createdAt: toDate(u.createdAt),
      },
      update: { name: u.name, phone: u.phone ?? null, role: u.role ?? 'user' },
    });
  }
  console.log(`✓ users: ${users.length}`);
}

async function seedReviews() {
  type R = {
    id: string;
    productId: string;
    productSlug: string;
    userId: string;
    userName: string;
    userEmail: string;
    rating: number;
    title?: string;
    comment?: string;
    status: string;
    createdAt?: string;
    updatedAt?: string;
  };
  const reviews = readJson<R[]>('.dev-reviews.json') ?? [];
  for (const r of reviews) {
    const data = {
      id: r.id,
      productId: r.productId,
      productSlug: r.productSlug,
      userId: r.userId,
      userName: r.userName,
      userEmail: r.userEmail,
      rating: r.rating,
      title: r.title ?? null,
      comment: r.comment ?? null,
      status: r.status,
      createdAt: toDate(r.createdAt),
      updatedAt: toDate(r.updatedAt),
    };
    await prisma.review.upsert({ where: { id: r.id }, create: data, update: data });
  }
  console.log(`✓ reviews: ${reviews.length}`);
}

async function seedSettings() {
  const s = readJson<Record<string, unknown>>('.dev-settings.json');
  if (!s) {
    console.log('✓ settings: none (defaults applied lazily at runtime)');
    return;
  }
  const data = {
    shopName: (s.shopName as string) ?? 'JILBER Performance',
    contactEmail: (s.contactEmail as string) ?? '',
    contactPhone: (s.contactPhone as string) ?? '',
    address: (s.address as string) ?? '',
    currency: (s.currency as string) ?? 'USD',
    taxRate: (s.taxRate as number) ?? 10,
    bookingMessage: (s.bookingMessage as string) ?? '',
    whatsappNumber: (s.whatsappNumber as string) ?? '',
    googleMapsUrl: (s.googleMapsUrl as string) ?? '',
    workingHours: (s.workingHours as string) ?? '',
    enableFloatingWhatsApp: (s.enableFloatingWhatsApp as boolean) ?? true,
    enableFloatingCall: (s.enableFloatingCall as boolean) ?? true,
    defaultWhatsAppMessage: (s.defaultWhatsAppMessage as string) ?? '',
    quoteWhatsAppMessage: (s.quoteWhatsAppMessage as string) ?? '',
    productWhatsAppMessage: (s.productWhatsAppMessage as string) ?? '',
  };
  await prisma.setting.upsert({ where: { id: 1 }, create: { id: 1, ...data }, update: data });
  console.log('✓ settings: imported');
}

async function seedOrders() {
  const orders = readJson<Record<string, unknown>[]>('.dev-orders.json') ?? [];
  for (const raw of orders) {
    // Legacy normalization (mirrors the old migrateOrder helper)
    let status = (raw.status as string) ?? 'pending';
    if (status === 'in-progress') status = 'in_progress';
    const adminNotes = (raw.adminNotes as string) ?? (raw.notes as string) ?? null;
    const id = raw.id as string;
    const customer = raw.customer as Record<string, string>;
    const vehicle = raw.vehicle as Record<string, string>;
    const items = (raw.items as Record<string, unknown>[]) ?? [];
    const history = (raw.statusHistory as Record<string, unknown>[]) ?? [];

    const data = {
      id,
      ref: raw.ref as string,
      status,
      paymentStatus: (raw.paymentStatus as string) ?? 'unpaid',
      createdAt: toDate(raw.createdAt),
      updatedAt: toDate(raw.updatedAt ?? raw.createdAt),
      completedAt: toDateOpt(raw.completedAt),
      cancelledAt: toDateOpt(raw.cancelledAt),
      userId: (raw.userId as string) ?? null,
      customerFullName: customer?.fullName ?? '',
      customerEmail: customer?.email ?? '',
      customerPhone: customer?.phone ?? '',
      customerAddress: customer?.address ?? '',
      vehicleMake: vehicle?.make ?? '',
      vehicleModel: vehicle?.model ?? '',
      vehicleYear: vehicle?.year ?? '',
      vehicleEngine: vehicle?.engine ?? '',
      vehicleCurrentMods: vehicle?.currentMods ?? '',
      vehicleServiceDate: vehicle?.serviceDate ?? '',
      payment: (raw.payment as string) ?? '',
      subtotal: (raw.subtotal as number) ?? 0,
      tax: (raw.tax as number) ?? 0,
      total: (raw.total as number) ?? 0,
      currency: (raw.currency as string) ?? 'USD',
      adminNotes,
      customerNotes: (raw.customerNotes as string) ?? null,
      items: {
        // Fresh row id per line item — OrderItem.id is a shared-table primary
        // key; legacy JSON reused the product id, which collides across orders.
        create: items.map((i) => ({
          id: randomUUID(),
          slug: i.slug as string,
          name: i.name as string,
          category: i.category as string,
          price: (i.price as number) ?? 0,
          currency: (i.currency as string) ?? 'USD',
          quantity: (i.quantity as number) ?? 1,
          visualColor: (i.visualColor as string) ?? '#000000',
        })),
      },
      statusHistory: {
        create: (history.length
          ? history
          : [
              {
                id: randomUUID(),
                fromStatus: null,
                toStatus: status,
                changedByUserId: 'system',
                changedByName: 'System',
                note: 'Imported',
                createdAt: raw.createdAt,
              },
            ]
        ).map((h) => ({
          id: (h.id as string) || randomUUID(),
          fromStatus: (h.fromStatus as string) ?? null,
          toStatus: (h.toStatus as string) ?? status,
          changedByUserId: (h.changedByUserId as string) ?? 'system',
          changedByName: (h.changedByName as string) ?? 'System',
          note: (h.note as string) ?? null,
          createdAt: toDate(h.createdAt),
        })),
      },
    };

    // Replace children cleanly on re-run
    await prisma.order.deleteMany({ where: { id } });
    await prisma.order.create({ data });
  }
  console.log(`✓ orders: ${orders.length}`);
}

async function seedQuotes() {
  const quotes = readJson<Record<string, unknown>[]>('.dev-quotes.json') ?? [];
  for (const q of quotes) {
    const data = {
      id: q.id as string,
      quoteNumber: q.quoteNumber as string,
      userId: (q.userId as string) ?? null,
      customerName: q.customerName as string,
      customerEmail: q.customerEmail as string,
      customerPhone: q.customerPhone as string,
      preferredContactMethod: (q.preferredContactMethod as string) ?? 'phone',
      vehicleMake: q.vehicleMake as string,
      vehicleModel: q.vehicleModel as string,
      vehicleYear: q.vehicleYear as string,
      vehicleEngine: q.vehicleEngine as string,
      transmission: (q.transmission as string) ?? null,
      mileage: (q.mileage as string) ?? null,
      currentModifications: (q.currentModifications as string) ?? null,
      serviceCategory: q.serviceCategory as string,
      performanceGoal: (q.performanceGoal as string) ?? null,
      budgetRange: (q.budgetRange as string) ?? null,
      desiredTimeline: (q.desiredTimeline as string) ?? null,
      message: q.message as string,
      relatedProductId: (q.relatedProductId as string) ?? null,
      relatedProductSlug: (q.relatedProductSlug as string) ?? null,
      relatedProductName: (q.relatedProductName as string) ?? null,
      attachments: JSON.stringify((q.attachments as string[]) ?? []),
      status: (q.status as string) ?? 'new',
      priority: (q.priority as string) ?? 'normal',
      adminNotes: (q.adminNotes as string) ?? null,
      customerReply: (q.customerReply as string) ?? null,
      createdAt: toDate(q.createdAt),
      updatedAt: toDate(q.updatedAt ?? q.createdAt),
      contactedAt: toDateOpt(q.contactedAt),
      quotedAt: toDateOpt(q.quotedAt),
      convertedToOrderId: (q.convertedToOrderId as string) ?? null,
    };
    await prisma.quote.upsert({ where: { id: data.id }, create: data, update: data });
  }
  console.log(`✓ quotes: ${quotes.length}`);
}

async function main() {
  console.log('Seeding MSSQL from legacy JSON stores…');
  await seedCategories();
  await seedProducts();
  await seedUsers();
  await seedReviews();
  await seedSettings();
  await seedOrders();
  await seedQuotes();
  console.log('Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
