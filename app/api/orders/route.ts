import { NextResponse, after } from 'next/server';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { createOrder, attachWhishExternalId, clearWhishExternalId } from '@/lib/orders';
import { getSession } from '@/lib/session';
import { getProductsBySlugs } from '@/lib/products';
import { getSettings } from '@/lib/settings';
import { STORE_CURRENCY, computeTotals } from '@/lib/currency';
import { notifyOrderCreated } from '@/lib/order-notifications';
import { getWhishClient, toWhishCurrency } from '@/lib/payments/whish';
import { siteConfig } from '@/lib/seo/site-config';
import { rateLimit, getClientIp, tooManyRequests } from '@/lib/rate-limit';
import type { PaymentStatus } from '@/types/admin';
import { logger } from '@/lib/logger';

const itemSchema = z.object({
  slug: z.string().min(1),
  quantity: z.number().int().positive().max(99),
  /**
   * The unit price the customer was actually SHOWN, from their cart.
   *
   * Never used for pricing — the server always charges the live DB price. It
   * exists only so a mismatch can be detected and the customer re-shown the
   * real total instead of being silently charged a different one. The cart is
   * persisted in localStorage with no TTL, so a price edited in admin after the
   * item was added would otherwise be displayed at the old price and charged at
   * the new one.
   *
   * Optional so older clients with a stale bundle still work; they simply lose
   * the check rather than failing outright.
   */
  expectedPrice: z.number().nonnegative().optional(),
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

    // One query for the whole cart, not one per line item.
    const productsBySlug = await getProductsBySlugs(items.map((i) => i.slug));

    const resolvedItems = [];
    const repricedItems: { slug: string; name: string; was: number; now: number }[] = [];
    for (const item of items) {
      const product = productsBySlug.get(item.slug);
      if (!product) {
        return NextResponse.json(
          { error: `Product not found: ${item.slug}` },
          { status: 400 }
        );
      }
      // `inStock` was previously enforced only by AddToCartButton in the browser,
      // so a hand-crafted request could order anything an admin had marked
      // unavailable. The server is the only place this can actually be enforced.
      if (!product.inStock) {
        return NextResponse.json(
          { error: `${product.name} is no longer available. Please remove it from your cart.` },
          { status: 409 }
        );
      }
      // The store is USD-only (see lib/currency.ts). A product row carrying some
      // other currency would be summed into the total as a bare scalar and then
      // charged as USD, so refuse rather than silently mis-charge.
      if (product.currency !== STORE_CURRENCY) {
        logger.error('orders.product_currency_mismatch', undefined, {
          slug: product.slug,
          found: product.currency,
          expected: STORE_CURRENCY,
        });
        return NextResponse.json(
          { error: `${product.name} is temporarily unavailable. Please contact us to complete this order.` },
          { status: 409 }
        );
      }
      // The cart lives in localStorage with no TTL, so the price the customer is
      // looking at can be arbitrarily old. The server always charges the live
      // price — but charging a different number than the one on screen is the
      // exact failure this codebase already fixed for tax, so detect it and send
      // the customer back to re-confirm instead.
      if (
        item.expectedPrice !== undefined &&
        Math.abs(item.expectedPrice - product.price) > 0.009
      ) {
        repricedItems.push({
          slug: product.slug,
          name: product.name,
          was: item.expectedPrice,
          now: product.price,
        });
      }

      resolvedItems.push({
        id: product.id,
        slug: product.slug,
        name: product.name,
        category: product.category,
        price: product.price,
        currency: STORE_CURRENCY,
        quantity: item.quantity,
        visualColor: product.visualColor,
      });
    }

    if (repricedItems.length > 0) {
      logger.info('orders.price_changed_since_cart', { items: repricedItems });
      return NextResponse.json(
        {
          error:
            repricedItems.length === 1
              ? `The price of ${repricedItems[0].name} changed since you added it. Please review the updated total.`
              : 'Some prices changed since you added these items. Please review the updated total.',
          code: 'PRICE_CHANGED',
          repriced: repricedItems,
        },
        { status: 409 }
      );
    }

    // Same helper the cart UI uses, so the displayed total and the charged total
    // cannot drift apart.
    const { taxRate } = await getSettings();
    const { subtotal, tax, total } = computeTotals(
      resolvedItems.reduce((s, i) => s + i.price * i.quantity, 0),
      taxRate
    );

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
      currency: STORE_CURRENCY,
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
      after(() => notifyOrderCreated(order));
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
          // Whish never accepted this externalId, so no money can ever arrive
          // against it. Detach it: otherwise the order looks "sent to payment
          // but unconfirmed" forever, the reconciliation cron retries it every
          // 15 minutes, getPaymentStatus errors, and the job exits non-zero on
          // every tick — training the operator to ignore the alert that exists
          // to catch genuinely lost money.
          await clearWhishExternalId(order.id);
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
        // The order row already exists at this point but has no payment session.
        // Log the ref so it can be matched against Whish's side if a customer
        // reports being charged.
        logger.error('payment.create_failed', err, {
          orderRef: order.ref,
          orderId: order.id,
          total: order.total,
        });
        // Same reasoning as the !success branch above — do not leave a dangling
        // externalId for the reconciler to chase forever.
        await clearWhishExternalId(order.id);
        return NextResponse.json(
          { error: 'Could not start the card payment. Please try another method.' },
          { status: 502 }
        );
      }
    }

    return NextResponse.json({ orderId: order.id, ref: order.ref }, { status: 201 });
  } catch (err) {
    logger.error('orders.post.unhandled', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
