/**
 * Store currency — single source of truth.
 *
 * The store is USD-only. This is deliberate and load-bearing, not a placeholder:
 *
 *   - `toWhishCurrency()` silently coerces an unsupported currency to USD and
 *     charges the numeric total, while `shouldMarkPaid()` rejects that same
 *     currency. A non-USD setting therefore charged the customer and then left
 *     the order permanently `unpaid` with no confirmation email.
 *   - Products carry their own `currency` column, and order totals summed those
 *     per-product amounts as bare scalars — mixing USD and LBP line items
 *     produced a meaningless total labelled with the shop-wide currency.
 *
 * Both bugs are structural, not cosmetic, so currency is pinned here and removed
 * from admin settings. Re-introducing multi-currency means solving per-product
 * currency in the order-total path first — see docs/TASKS_3.md.
 */

export const STORE_CURRENCY = 'USD';

/** Explicit locale everywhere: a bare toLocaleString() renders differently on the
 *  server (VPS ICU default) and the client (browser locale), causing hydration
 *  mismatches on every price. */
export const STORE_LOCALE = 'en-US';

/** Formats a money amount for display, e.g. 1234.5 -> "$1,234.50". */
export function formatMoney(amount: number): string {
  return new Intl.NumberFormat(STORE_LOCALE, {
    style: 'currency',
    currency: STORE_CURRENCY,
  }).format(amount);
}

/** Formats without decimals when the amount is whole, e.g. admin list views. */
export function formatMoneyCompact(amount: number): string {
  return new Intl.NumberFormat(STORE_LOCALE, {
    style: 'currency',
    currency: STORE_CURRENCY,
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** A plain locale-pinned number, for places that supply their own symbol. */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat(STORE_LOCALE).format(n);
}

/** Rounds to 2dp the way every money path in the app does. */
export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Derives tax and total from a subtotal and a percentage rate (0–100).
 * Shared by the client cart display and the server order builder so the two can
 * never disagree — the displayed total previously used a hardcoded 10% while the
 * server charged the admin-configured rate.
 */
export function computeTotals(subtotal: number, taxRatePercent: number) {
  // Guard non-finite input explicitly. Math.min/max propagate NaN, so a NaN rate
  // produced NaN totals which JSON.stringify then serialised as `null` — silent
  // corruption in the one function documented as the source of truth for what a
  // customer is charged. Validation lives two modules away; do not depend on it.
  const safeRate = Number.isFinite(taxRatePercent) ? taxRatePercent : 0;
  const safeSubtotal = Number.isFinite(subtotal) ? subtotal : 0;
  const clamped = Math.min(Math.max(safeRate, 0), 100) / 100;
  const roundedSubtotal = round2(safeSubtotal);
  const tax = round2(roundedSubtotal * clamped);
  return { subtotal: roundedSubtotal, tax, total: round2(roundedSubtotal + tax) };
}
