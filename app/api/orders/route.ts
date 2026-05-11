import { NextResponse } from 'next/server';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { createOrder } from '@/lib/orders.dev';
import { getSession } from '@/lib/session';
import { getProductBySlug } from '@/lib/products.dev';
import { getSettings } from '@/lib/settings.dev';

// Only accept fields the client legitimately controls.
// Prices, totals, and ref are derived server-side.
const itemSchema = z.object({
  slug: z.string().min(1),
  quantity: z.number().int().positive().max(99),
});

const schema = z.object({
  customer: z.object({
    fullName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(1),
    address: z.string().default(''),
  }),
  vehicle: z.object({
    make: z.string().min(1),
    model: z.string().min(1),
    year: z.string().min(1),
    engine: z.string().default(''),
    currentMods: z.string().default(''),
    serviceDate: z.string().default(''),
  }),
  items: z.array(itemSchema).min(1).max(50),
  payment: z.enum(['shop', 'bank', 'card']),
});

function generateRef(): string {
  // Use crypto.randomBytes for better randomness than Math.random
  const n = (randomBytes(3).readUIntBE(0, 3) % 900000) + 100000;
  return `TUNE-${n}`;
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid order data' }, { status: 400 });
    }

    const { customer, vehicle, items, payment } = result.data;

    // Validate each slug against the product store and build server-authoritative items
    const resolvedItems = [];
    for (const item of items) {
      const product = getProductBySlug(item.slug);
      if (!product) {
        return NextResponse.json(
          { error: `Product not found: ${item.slug}` },
          { status: 400 }
        );
      }
      resolvedItems.push({
        id: product.id,
        slug: product.slug,
        name: product.name,
        category: product.category,
        price: product.price,
        currency: product.currency,
        quantity: item.quantity,
        visualColor: product.visualColor,
      });
    }

    // Recalculate totals from server-side product prices and configured tax rate
    const { taxRate } = getSettings();
    const clampedRate = Math.min(Math.max(taxRate, 0), 100) / 100;
    const subtotal = Math.round(
      resolvedItems.reduce((s, i) => s + i.price * i.quantity, 0) * 100
    ) / 100;
    const tax = Math.round(subtotal * clampedRate * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;

    const session = await getSession();
    const ref = generateRef();
    const order = createOrder({
      ref,
      customer,
      vehicle,
      items: resolvedItems,
      payment,
      subtotal,
      tax,
      total,
      userId: session?.id,
    });

    return NextResponse.json({ orderId: order.id, ref: order.ref }, { status: 201 });
  } catch (err) {
    console.error('[orders/POST]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
