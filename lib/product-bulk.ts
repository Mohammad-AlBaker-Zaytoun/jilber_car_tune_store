/**
 * Shared constants and helpers for bulk product operations.
 *
 * Deliberately free of any database import. lib/products.ts pulls in Prisma, so
 * a client component importing the batch size from there would drag the whole
 * client into the browser bundle. This module is safe on both sides.
 */

/**
 * Largest number of products one bulk delete request may touch.
 *
 * The catalogue is ~1,900 products and "select all" on an unfiltered list is a
 * realistic click. Deleting that many in a single transaction holds locks on
 * two tables for as long as it runs, so the admin UI splits its work into
 * chunks of this size: each transaction stays short, and a failure costs one
 * chunk rather than the entire operation.
 */
export const MAX_BULK_DELETE = 200;

/** Splits a list into consecutive runs of at most `size`. */
export function chunk<T>(items: readonly T[], size: number = MAX_BULK_DELETE): T[][] {
  if (size < 1) throw new Error('chunk size must be at least 1');
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}
