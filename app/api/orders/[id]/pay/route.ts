import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import {
  getOrderById,
  attachWhishExternalId,
  clearWhishExternalId,
  isSettleablePaymentStatus,
} from '@/lib/orders';
import { getWhishClient, toWhishCurrency } from '@/lib/payments/whish';
import { settleWhishOrder } from '@/lib/payments/whish-settle';
import {
  isCardPaymentAvailable,
  recordPaymentFailure,
  recordPaymentSuccess,
} from '@/lib/payments/whish-health';
import { verifyPayToken } from '@/lib/payments/pay-token';
import { siteConfig } from '@/lib/seo/site-config';
import { rateLimit, getClientIp, tooManyRequests } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

/**
 * POST /api/orders/[id]/pay — start (or restart) online payment for an existing
 * order.
 *
 * Exists because an unpaid card order previously could never be paid online: the
 * only producer of a payment session was order creation, so a customer whose
 * payment failed had to place a duplicate order. This is the recovery path for
 * both the gateway-failure capture and a customer who abandoned the Whish page.
 *
 * AUTHORISATION — either of:
 *   - a signed-in session owning the order, or
 *   - a valid pay token (?token=), which is how a GUEST recovers, since guest
 *     orders have no userId and no /account/orders to return to.
 *
 * Deliberately NOT exempt from the CSRF origin gate in proxy.ts: unlike the Whish
 * callback this is called by our own pages, so the gate applies normally.
 */
export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rl = rateLimit('order-pay:' + getClientIp(request), 10, 60_000);
    if (!rl.ok) return tooManyRequests(rl.retryAfter);

    const { id } = await params;
    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    // ---- Authorise -------------------------------------------------------
    let authorised = false;
    if (token) {
      const tokenOrderId = await verifyPayToken(token);
      // The order id comes from the SIGNED token, then must match the path — a
      // token for order A can never authorise paying order B.
      authorised = tokenOrderId !== null && tokenOrderId === id;
    }
    if (!authorised) {
      const session = await getSession();
      const order = session ? await getOrderById(id) : null;
      authorised = Boolean(session && order && order.userId === session.id);
    }
    if (!authorised) {
      // 404, not 403 — do not confirm that an order with this id exists.
      // Same convention as app/api/account/orders/[id]/route.ts.
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const order = await getOrderById(id);
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // ---- Refuse anything that must not be charged ------------------------
    if (order.status === 'cancelled') {
      return NextResponse.json(
        { error: 'This order was cancelled and can no longer be paid.' },
        { status: 409 }
      );
    }
    if (!isSettleablePaymentStatus(order.paymentStatus)) {
      // Covers 'paid', 'refunded', 'deposit_paid' and 'not_required'. Charging
      // any of these again would take money for an order already settled.
      return NextResponse.json(
        {
          error:
            order.paymentStatus === 'paid'
              ? 'This order has already been paid.'
              : 'This order is not awaiting online payment. Please contact us.',
          paymentStatus: order.paymentStatus,
        },
        { status: 409 }
      );
    }

    // ---- THE SAFETY STEP -------------------------------------------------
    // If a payment session already exists, settle it BEFORE replacing it.
    //
    // whishExternalId is a unique column and the callback resolves an order by
    // it. Minting a new id without checking would orphan a payment in flight on
    // the old one: if the customer completed the OLD link, the callback could no
    // longer find the order — money taken, order unpaid, and invisible to the
    // reconciler too. So only proceed once Whish confirms the existing session
    // was not paid.
    if (order.whishExternalId != null) {
      const outcome = await settleWhishOrder(order);
      if (outcome === 'paid_now' || outcome === 'already_paid') {
        logger.info('payment.resume_found_already_paid', {
          orderRef: order.ref,
          orderId: order.id,
          outcome,
        });
        return NextResponse.json(
          { alreadyPaid: true, ref: order.ref },
          { status: 200 }
        );
      }
      if (outcome === 'unavailable') {
        // We could not determine the state of the existing session. Replacing it
        // now risks exactly the orphaning described above, so refuse instead.
        return NextResponse.json(
          {
            error:
              'We could not confirm the status of your previous payment attempt. Please try again in a few minutes.',
          },
          { status: 503 }
        );
      }
      // outcome === 'not_paid' — safe to replace the session below.
    }

    // ---- Gateway availability -------------------------------------------
    const whish = getWhishClient();
    if (!whish || !isCardPaymentAvailable()) {
      return NextResponse.json(
        {
          error:
            'Online card payment is temporarily unavailable. Your order is saved — please try again shortly or pay at the workshop.',
        },
        { status: 503 }
      );
    }

    // ---- Create a fresh payment session ---------------------------------
    try {
      const externalId = whish.generateExternalId();
      await attachWhishExternalId(order.id, externalId);
      const result = await whish.createPayment({
        amount: order.total,
        currency: toWhishCurrency(order.currency),
        invoice: order.ref,
        externalId,
        successCallbackUrl: `${siteConfig.siteUrl}/api/whish/callback`,
        failureCallbackUrl: `${siteConfig.siteUrl}/api/whish/callback`,
        successRedirectUrl: `${siteConfig.siteUrl}/checkout/success?ref=${encodeURIComponent(order.ref)}`,
        failureRedirectUrl: `${siteConfig.siteUrl}/checkout/failure?ref=${encodeURIComponent(order.ref)}`,
      });

      if (!result.success || !result.collectUrl) {
        logger.error('payment.resume_rejected', undefined, {
          orderRef: order.ref,
          orderId: order.id,
          gatewayMessage: result.dialog?.message,
        });
        await clearWhishExternalId(order.id);
        recordPaymentFailure();
        return NextResponse.json(
          {
            error:
              'Online card payment is temporarily unavailable. Your order is saved — please try again shortly or pay at the workshop.',
          },
          { status: 503 }
        );
      }

      recordPaymentSuccess();
      logger.info('payment.resume_started', { orderRef: order.ref, orderId: order.id });
      return NextResponse.json({ collectUrl: result.collectUrl, ref: order.ref }, { status: 200 });
    } catch (err) {
      logger.error('payment.resume_failed', err, {
        orderRef: order.ref,
        orderId: order.id,
      });
      await clearWhishExternalId(order.id);
      recordPaymentFailure();
      return NextResponse.json(
        {
          error:
            'Online card payment is temporarily unavailable. Your order is saved — please try again shortly or pay at the workshop.',
        },
        { status: 503 }
      );
    }
  } catch (err) {
    logger.error('orders.pay.unhandled', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
