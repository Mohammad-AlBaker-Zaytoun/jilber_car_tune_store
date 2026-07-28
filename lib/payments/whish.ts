/**
 * Whish Money payment integration (server-only).
 *
 * Wraps the `whish-pay` client behind an env-gated factory so the app builds and
 * runs without payment credentials (card checkout is simply unavailable then).
 * WHISH_SECRET must never reach the browser — only import this from server code.
 */

import {
  WhishClient,
  isValidCurrency,
  validateAmount,
  type WhishCurrency,
  type StatusResponse,
} from 'whish-pay';
import { siteConfig } from '@/lib/seo/site-config';
import { STORE_CURRENCY } from '@/lib/currency';

let cached: WhishClient | null | undefined;

/**
 * True when the whish-pay client will talk to the PRODUCTION Whish API.
 *
 * whish-pay derives this from NODE_ENV internally and exposes no accessor, so we
 * mirror the same rule here. Any deploy where NODE_ENV !== 'production' runs
 * against lb.sandbox.whish.money — checkout appears to succeed and no money
 * moves. instrumentation.ts asserts on this at boot so it can never be silent.
 */
export function isWhishProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/** True when Whish credentials are configured at all. */
export function isWhishConfigured(): boolean {
  return Boolean(process.env.WHISH_CHANNEL && process.env.WHISH_SECRET);
}

/**
 * Returns a configured WhishClient, or null when WHISH_CHANNEL / WHISH_SECRET
 * are unset. The environment (sandbox vs production) auto-detects from NODE_ENV.
 */
export function getWhishClient(): WhishClient | null {
  if (cached !== undefined) return cached;
  const channel = process.env.WHISH_CHANNEL;
  const secret = process.env.WHISH_SECRET;
  if (!channel || !secret) {
    cached = null;
    return cached;
  }
  cached = new WhishClient({ channel, secret, websiteUrl: siteConfig.siteUrl });
  return cached;
}

/**
 * Maps an order currency to a Whish-supported one.
 *
 * This used to silently fall back to USD for any unrecognised currency, which
 * meant an order in e.g. EUR was *charged* as USD while shouldMarkPaid() then
 * rejected the same currency — the customer paid and the order stayed unpaid
 * forever. Now it throws: refusing to start a payment is always better than
 * charging the wrong currency.
 */
export function toWhishCurrency(currency: string): WhishCurrency {
  if (!isValidCurrency(currency)) {
    throw new Error(
      `Unsupported payment currency "${currency}" — refusing to charge. ` +
        `The store is ${STORE_CURRENCY}-only (see lib/currency.ts).`
    );
  }
  return currency;
}

/**
 * Pure decision: should this order be marked paid given the authoritative Whish
 * status? True only when the collection succeeded AND the charged amount matches
 * the order total within the currency tolerance. No network — unit-testable.
 */
export function shouldMarkPaid(
  status: StatusResponse,
  expectedAmount: number,
  currency: string
): boolean {
  if (status.collectStatus !== 'success') return false;
  if (typeof status.amount !== 'number') return false;
  if (!isValidCurrency(currency)) return false;
  return validateAmount(status.amount, expectedAmount, currency);
}
