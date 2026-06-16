import { NextResponse } from 'next/server';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { createOrder, attachWhishExternalId } from '@/lib/orders';
import { getSession } from '@/lib/session';
import { getProductBySlug } from '@/lib/products';
import { getSettings } from '@/lib/settings';
import { notifyOrderCreated } from '@/lib/order-notifications';
import { getWhishClient, toWhishCurrency } from '@/lib/payments/whish';
import { siteConfig } from '@/lib/seo/site-config';
import { rateLimit, getClientIp, tooManyRequests } from '@/lib/rate-limit';
import type { PaymentStatus } from '@/types/admin';

const itemSchema = z.object({
  slug: z.string().min(1),
  quantity: z.number().int().positive().max(99),
});

const schema = z.object({
  customer: z.object({
    fullName: z.string().min(1).max(100),
    email: z.string().email().max(200),
    phone: z.string().min(1).max(30),
    address: z.string().max(300).default(''),
  }),
  vehicle: z.object({
    make: z.string().min(1).max(60),
    model: z.string().min(1).max(60),
    year: z.string().min(1).max(10),
    engine: z.string().max(80).default(''),
    currentMods: z.string().max(1000).default(''),
    serviceDate: z.string().max(40).default(''),
  }),
  items: z.array(itemSchema).min(1).max(50),
  payment: z.enum(['shop', 'bank', 'card']),
});

function generateRef(): string {
  const date = new Date();
  const yyyymmdd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(5);
  const code = Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join('');
  return `TUNE-${yyyymmdd}-${code}`;
}

function initialPaymentStatus(payment: 'shop' | 'bank' | 'card'): PaymentStatus {
  if (payment === 'bank') return 'deposit_pending';
  return 'unpaid';
}

export async function POST(request: Request) {
  try {
    const rl = rateLimit('orders:' + getClientIp(request), 8, 60_000);
    if (!rl.ok) return tooManyRequests(rl.retryAfter);

    const body: unknown = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid order data' }, { status: 400 });
    }

    const { customer, vehicle, items, payment } = result.data;

    // Card payments go through Whish — fail fast if it isn't configured rather
    // than silently creating an unpaid order the customer thinks they paid for.
    const whish = payment === 'card' ? getWhishClient() : null;
    if (payment === 'card' && !whish) {
      return NextResponse.json(
        { error: 'Card payments are currently unavailable. Please choose another method.' },
        { status: 503 }
      );
    }

    const resolvedItems = [];
    for (const item of items) {
      const product = await getProductBySlug(item.slug);
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

    const { taxRate, currency } = await getSettings();
    const clampedRate = Math.min(Math.max(taxRate, 0), 100) / 100;
    const subtotal = Math.round(
      resolvedItems.reduce((s, i) => s + i.price * i.quantity, 0) * 100
    ) / 100;
    const tax = Math.round(subtotal * clampedRate * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;

    const session = await getSession();
    const ref = generateRef();

    const order = await createOrder({
      ref,
      customer,
      vehicle,
      items: resolvedItems,
      payment,
      paymentStatus: initialPaymentStatus(payment),
      subtotal,
      tax,
      total,
      currency: currency ?? 'USD',
      userId: session?.id,
      initialHistoryEntry: {
        fromStatus: null,
        toStatus: 'pending',
        changedByUserId: session?.id ?? 'guest',
        changedByName: session?.name ?? customer.fullName,
        note: 'Order placed by customer',
        createdAt: new Date().toISOString(),
      },
    });

    // Shop/bank orders are confirmed on placement. Card orders are unpaid until
    // Whish confirms, so their confirmation (and admin alert) is sent from the
    // payment callback instead — not here, before any money has arrived.
    if (payment !== 'card') {
      notifyOrderCreated(order);
    }

    // Card: initiate a Whish payment and hand the client the hosted-page URL.
    if (payment === 'card' && whish) {
      try {
        const externalId = whish.generateExternalId();
        await attachWhishExternalId(order.id, externalId);
        const whishCurrency = toWhishCurrency(order.currency);
        const result = await whish.createPayment({
          amount: order.total,
          currency: whishCurrency,
          invoice: order.ref,
          externalId,
          successCallbackUrl: `${siteConfig.siteUrl}/api/whish/callback`,
          failureCallbackUrl: `${siteConfig.siteUrl}/api/whish/callback`,
          successRedirectUrl: `${siteConfig.siteUrl}/checkout/success?ref=${encodeURIComponent(order.ref)}`,
          failureRedirectUrl: `${siteConfig.siteUrl}/checkout/failure?ref=${encodeURIComponent(order.ref)}`,
        });
        if (!result.success || !result.collectUrl) {
          return NextResponse.json(
            { error: result.dialog?.message ?? 'Could not start the card payment. Please try another method.' },
            { status: 502 }
          );
        }
        return NextResponse.json(
          { orderId: order.id, ref: order.ref, collectUrl: result.collectUrl },
          { status: 201 }
        );
      } catch (err) {
        console.error('[orders/POST] whish createPayment', err);
        return NextResponse.json(
          { error: 'Could not start the card payment. Please try another method.' },
          { status: 502 }
        );
      }
    }

    return NextResponse.json({ orderId: order.id, ref: order.ref }, { status: 201 });
  } catch (err) {
    console.error('[orders/POST]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
