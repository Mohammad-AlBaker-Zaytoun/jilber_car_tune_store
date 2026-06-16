import { NextResponse } from 'next/server';
import { parseCallbackUrl } from 'whish-pay';
import { getWhishClient, toWhishCurrency, shouldMarkPaid } from '@/lib/payments/whish';
import { getOrderByWhishExternalId, markOrderPaidByWhish } from '@/lib/orders';
import { notifyOrderCreated } from '@/lib/order-notifications';
import { siteConfig } from '@/lib/seo/site-config';

// Whish redirects the browser here (GET) after payment. This is a cross-origin
// GET, so the proxy CSRF gate (which only blocks non-safe methods) lets it pass.
export const dynamic = 'force-dynamic';

function redirect(path: string) {
  return NextResponse.redirect(`${siteConfig.siteUrl}${path}`);
}

/**
 * GET /api/whish/callback — success/failure return URL for Whish.
 *
 * Never trusts the redirect itself: it re-queries the authoritative payment
 * status and verifies the charged amount before marking the order paid. Then it
 * redirects the customer to the success or failure page.
 */
export async function GET(request: Request) {
  try {
    const whish = getWhishClient();
    if (!whish) return redirect('/checkout/failure');

    const { externalId, currency } = parseCallbackUrl(request.url);
    if (externalId == null || !currency) return redirect('/checkout/failure');

    const order = await getOrderByWhishExternalId(externalId);
    if (!order) return redirect('/checkout/failure');

    const refQs = `?ref=${encodeURIComponent(order.ref)}`;

    const status = await whish.getPaymentStatus(toWhishCurrency(order.currency), externalId);

    if (shouldMarkPaid(status, order.total, order.currency)) {
      const outcome = await markOrderPaidByWhish(order.id, status.transactionId);
      // Send the customer confirmation + admin alert once, on the paid transition
      // (the create handler skips card orders). Replays land on 'already_paid'.
      if (outcome === 'paid_now') notifyOrderCreated(order);
      return redirect(`/checkout/success${refQs}`);
    }

    return redirect(`/checkout/failure${refQs}`);
  } catch (err) {
    console.error('[whish/callback]', err);
    return redirect('/checkout/failure');
  }
}
