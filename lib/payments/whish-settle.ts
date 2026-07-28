/**
 * Authoritative settlement of a Whish payment.
 *
 * Shared by the callback route and the reconciliation job so both settle an
 * order through exactly one code path. Never trusts the callback query string:
 * it re-queries Whish for the real status and verifies the charged amount
 * against the stored order total before marking anything paid.
 */

import { getWhishClient, toWhishCurrency, shouldMarkPaid } from '@/lib/payments/whish';
import { markOrderPaidByWhish } from '@/lib/orders';
import { notifyOrderCreated } from '@/lib/order-notifications';
import { logger } from '@/lib/logger';
import type { Order } from '@/types/admin';

export type SettleOutcome =
  /** Transitioned to paid on this call — confirmation emails were sent. */
  | 'paid_now'
  /** Already paid (callback replay, or the reconciler racing the callback). */
  | 'already_paid'
  /** Whish says the collection did not succeed, or the amount did not match. */
  | 'not_paid'
  /** Could not reach Whish / no client configured. Safe to retry later. */
  | 'unavailable';

/**
 * Settles one order against Whish's authoritative status.
 *
 * Returns 'unavailable' rather than throwing on a transport failure so callers
 * can distinguish "genuinely not paid" from "we could not tell" — the two need
 * very different handling (fail the customer vs. retry later).
 */
export async function settleWhishOrder(order: Order): Promise<SettleOutcome> {
  const whish = getWhishClient();
  if (!whish || order.whishExternalId == null) return 'unavailable';

  let status;
  try {
    status = await whish.getPaymentStatus(
      toWhishCurrency(order.currency),
      Number(order.whishExternalId)
    );
  } catch (err) {
    logger.error('payment.status_query_failed', err, {
      orderRef: order.ref,
      orderId: order.id,
      whishExternalId: String(order.whishExternalId),
    });
    return 'unavailable';
  }

  if (!shouldMarkPaid(status, order.total, order.currency)) return 'not_paid';

  const outcome = await markOrderPaidByWhish(order.id, status.transactionId);
  if (outcome === 'paid_now') {
    logger.info('payment.settled', {
      orderRef: order.ref,
      orderId: order.id,
      total: order.total,
      currency: order.currency,
      transactionId: status.transactionId,
    });
    // The create handler deliberately skips confirmation for card orders, so this
    // is the only place a paid card order notifies anyone. markOrderPaidByWhish
    // is atomic, so exactly one caller ever reaches this branch.
    await notifyOrderCreated(order);
    return 'paid_now';
  }
  if (outcome === 'already_paid') return 'already_paid';

  // The order vanished between the lookup and the update.
  logger.error('payment.order_disappeared', undefined, {
    orderRef: order.ref,
    orderId: order.id,
  });
  return 'unavailable';
}
