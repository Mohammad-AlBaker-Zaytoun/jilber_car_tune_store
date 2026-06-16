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

let cached: WhishClient | null | undefined;

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

/** Maps an arbitrary settings currency to a Whish-supported one (default USD). */
export function toWhishCurrency(currency: string): WhishCurrency {
  return isValidCurrency(currency) ? currency : 'USD';
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
