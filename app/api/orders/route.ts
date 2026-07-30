import { NextResponse, after } from 'next/server';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import {
  createOrder,
  attachWhishExternalId,
  clearWhishExternalId,
  markOnlinePaymentUnavailable,
} from '@/lib/orders';
import { getSession } from '@/lib/session';
import { getProductsBySlugs } from '@/lib/products';
import { getSettings } from '@/lib/settings';
import { STORE_CURRENCY, computeTotals } from '@/lib/currency';
import { notifyOrderCreated, notifyOrderPaymentUnavailable } from '@/lib/order-notifications';
import { getWhishClient, toWhishCurrency } from '@/lib/payments/whish';
import {
  isCardPaymentAvailable,
  recordPaymentFailure,
  recordPaymentSuccess,
} from '@/lib/payments/whish-health';
import { createPayToken } from '@/lib/payments/pay-token';
import { siteConfig } from '@/lib/seo/site-config';
import { rateLimit, getClientIp, tooManyRequests } from '@/lib/rate-limit';
import type { Order, PaymentStatus } from '@/types/admin';
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

/**
 * Keeps a card order that the gateway could not take payment for.
 *
 * The order row is written before the gateway is called, so the alternative —
 * returning 502 and walking away — left a real order nobody was told about, and
 * an error message ("try another method") that invited the customer to create a
 * duplicate. This captures the sale instead:
 *
 *  - detach the externalId (Whish never accepted it, so no money can arrive
 *    against it, and leaving it attached makes the reconciler chase it forever)
 *  - record WHY, in the admin notes and the order timeline, so this is
 *    distinguishable from a customer who merely abandoned the payment page
 *  - email the customer a confirmation plus a signed pay link — this is the only
 *    path that notifies them, since notifyOrderCreated is skipped for card orders
 *  - alert the admin that payment needs collecting
 *  - trip the circuit breaker so the next customer is not sent down the same path
 *
 * Returns 201: from the customer's point of view the order succeeded, which is
 * true. `paymentUnavailable` tells the client to explain that payment is pending.
 */
async function captureWithoutPayment(order: Order, reason: string) {
  await clearWhishExternalId(order.id);
  const updated = (await markOnlinePaymentUnavailable(order.id, reason)) ?? order;
  recordPaymentFailure();

  const payUrl = `${siteConfig.siteUrl}/checkout/pay?token=${encodeURIComponent(
    await createPayToken(order.id)
  )}`;

  after(async () => {
    await notifyOrderCreated(updated);
    await notifyOrderPaymentUnavailable(updated, payUrl);
  });

  logger.warn('payment.captured_without_payment', {
    orderRef: order.ref,
    orderId: order.id,
    total: order.total,
    reason,
  });

  return NextResponse.json(
    { orderId: order.id, ref: order.ref, paymentUnavailable: true },
    { status: 201 }
  );
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

    // Card payments go through Whish. Fail fast BEFORE writing the order rather
    // than silently creating an unpaid order the customer thinks they paid for.
    //
    // Checks availability, not just configuration: when the circuit breaker is
    // open we already know the gateway is failing, so there is no point calling
    // it and then capturing an order that needs manual payment chasing. The
    // checkout page no longer offers Card in this state, so reaching here means a
    // stale client — and telling them to pick another method costs nothing,
    // because their cart and form are still intact.
    const whish = payment === 'card' ? getWhishClient() : null;
    if (payment === 'card' && (!whish || !isCardPaymentAvailable())) {
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
          // The gateway's own message is logged, never shown — it is third-party
          // copy that could say anything to our customer.
          logger.error('payment.create_rejected', undefined, {
            orderRef: order.ref,
            orderId: order.id,
            total: order.total,
            gatewayMessage: result.dialog?.message,
          });
          return captureWithoutPayment(order, 'gateway rejected the request');
        }

        recordPaymentSuccess();
        return NextResponse.json(
          { orderId: order.id, ref: order.ref, collectUrl: result.collectUrl },
          { status: 201 }
        );
      } catch (err) {
        logger.error('payment.create_failed', err, {
          orderRef: order.ref,
          orderId: order.id,
          total: order.total,
        });
        return captureWithoutPayment(order, 'could not reach the payment gateway');
      }
    }

    return NextResponse.json({ orderId: order.id, ref: order.ref }, { status: 201 });
  } catch (err) {
    logger.error('orders.post.unhandled', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
