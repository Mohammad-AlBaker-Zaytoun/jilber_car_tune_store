import { NextResponse } from 'next/server';
import { parseCallbackUrl } from 'whish-pay';
import { getOrderByWhishExternalId } from '@/lib/orders';
import { settleWhishOrder } from '@/lib/payments/whish-settle';
import { siteConfig } from '@/lib/seo/site-config';

// Whish redirects the browser here (GET) after payment and also calls it
// server-to-server. This is cross-origin, so the proxy CSRF gate (which only
// blocks non-safe methods) lets GET pass.
export const dynamic = 'force-dynamic';

function redirect(path: string) {
  return NextResponse.redirect(`${siteConfig.siteUrl}${path}`);
}

/**
 * Resolves the order from the callback URL and settles it against Whish's
 * authoritative status. Shared by both the browser and server-to-server paths so
 * they can never diverge.
 */
async function handleCallback(request: Request) {
  const { externalId } = parseCallbackUrl(request.url);
  if (externalId == null) return { outcome: 'not_paid' as const, ref: null };

  const order = await getOrderByWhishExternalId(externalId);
  if (!order) {
    console.error(`[whish/callback] no order for externalId ${externalId}`);
    return { outcome: 'not_paid' as const, ref: null };
  }

  const outcome = await settleWhishOrder(order);

  // 'unavailable' means we could not reach Whish — the customer may well have
  // paid. Never silently drop it: the reconciliation job picks these up, but it
  // must be visible in logs/alerting now.
  if (outcome === 'unavailable') {
    console.error(
      `[whish/callback] could not confirm payment for order ${order.ref} — ` +
        `left unpaid for reconciliation`
    );
  }

  return { outcome, ref: order.ref };
}

/**
 * POST /api/whish/callback — server-to-server notification.
 *
 * Returns a plain 200/502, never a redirect: many gateways treat a 3xx on a
 * server-to-server callback as failed delivery and stop retrying.
 */
export async function POST(request: Request) {
  try {
    const { outcome } = await handleCallback(request);
    if (outcome === 'unavailable') {
      // Non-2xx invites the gateway to retry, which is what we want.
      return NextResponse.json({ received: true, settled: false }, { status: 502 });
    }
    return NextResponse.json({ received: true, outcome }, { status: 200 });
  } catch (err) {
    console.error('[whish/callback POST]', err);
    return NextResponse.json({ received: false }, { status: 500 });
  }
}

/**
 * GET /api/whish/callback — success/failure return URL the customer's browser
 * lands on. Settles the payment, then redirects to the success or failure page.
 */
export async function GET(request: Request) {
  try {
    const { outcome, ref } = await handleCallback(request);
    const refQs = ref ? `?ref=${encodeURIComponent(ref)}` : '';

    if (outcome === 'paid_now' || outcome === 'already_paid') {
      return redirect(`/checkout/success${refQs}`);
    }
    return redirect(`/checkout/failure${refQs}`);
  } catch (err) {
    console.error('[whish/callback GET]', err);
    return redirect('/checkout/failure');
  }
}
