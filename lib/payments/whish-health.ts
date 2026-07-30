/**
 * Circuit breaker for the Whish payment gateway.
 *
 * Without this, an outage means every customer who picks "Card" is walked all
 * the way through the form and into a failure. The breaker stops offering the
 * option after a few consecutive failures so they are routed to a working
 * payment method instead of a broken one.
 *
 * SCOPE: this gates payment *creation* only — starting a new charge.
 * `settleWhishOrder()` and the callback must keep working while the breaker is
 * open, or payments already in flight would stop confirming during an outage and
 * a checkout problem would become a money problem. Nothing here is imported by
 * the settle path.
 *
 * Same single-process caveat as lib/rate-limit.ts: state lives in this process,
 * so `pm2 instances: 1` (deploy/ecosystem.config.js) remains load-bearing. With
 * multiple workers each keeps its own count, which degrades the breaker to
 * "opens later" — it never fails unsafe.
 */

import { isWhishConfigured } from './whish';
import { logger } from '@/lib/logger';

/** Consecutive failures before the gateway is treated as down. */
const FAILURE_THRESHOLD = 3;
/** How long to stop offering card payment once tripped. */
const OPEN_MS = 5 * 60_000;

interface BreakerState {
  consecutiveFailures: number;
  /** Timestamp the breaker stays open until (0 = closed). */
  openUntil: number;
}

/**
 * Pinned to globalThis, following lib/db/prisma.ts.
 *
 * A plain module-level `const state` is NOT shared between a route handler and a
 * page render: the build emits them as separate server chunks, so each gets its
 * own instance of this module. That was observably broken — POST /api/orders
 * would trip the breaker and correctly answer 503, while /checkout kept
 * rendering the Card option from a copy of the state that had never seen a
 * failure. The customer was still walked into the failing path, which is the
 * exact outcome this breaker exists to prevent. globalThis is per-process, so
 * both chunks now read the same counter.
 */
const globalForBreaker = globalThis as unknown as { whishBreaker?: BreakerState };

const state: BreakerState =
  globalForBreaker.whishBreaker ?? { consecutiveFailures: 0, openUntil: 0 };
globalForBreaker.whishBreaker = state;

/** True when the breaker is currently open (gateway treated as down). */
export function isBreakerOpen(now = Date.now()): boolean {
  return now < state.openUntil;
}

/**
 * Whether card payment should be offered to customers right now.
 *
 * Requires BOTH credentials and a closed breaker — "not configured" and
 * "configured but failing" are different causes with the same correct answer.
 */
export function isCardPaymentAvailable(now = Date.now()): boolean {
  return isWhishConfigured() && !isBreakerOpen(now);
}

/**
 * Records a failed attempt to create a payment. Trips the breaker once failures
 * reach the threshold.
 */
export function recordPaymentFailure(now = Date.now()): void {
  state.consecutiveFailures += 1;

  if (state.consecutiveFailures >= FAILURE_THRESHOLD && !isBreakerOpen(now)) {
    state.openUntil = now + OPEN_MS;
    logger.error('payment.gateway_breaker_open', undefined, {
      consecutiveFailures: state.consecutiveFailures,
      openForSeconds: OPEN_MS / 1000,
      detail: 'card payment will not be offered until this expires or a call succeeds',
    });
  }
}

/** Records a success. Closes the breaker and resets the count. */
export function recordPaymentSuccess(now = Date.now()): void {
  const wasOpen = isBreakerOpen(now);
  state.consecutiveFailures = 0;
  state.openUntil = 0;
  if (wasOpen) {
    logger.info('payment.gateway_breaker_closed', {
      detail: 'a payment succeeded; card payment is available again',
    });
  }
}

/** Test seam. */
export function __resetBreaker(): void {
  state.consecutiveFailures = 0;
  state.openUntil = 0;
}
