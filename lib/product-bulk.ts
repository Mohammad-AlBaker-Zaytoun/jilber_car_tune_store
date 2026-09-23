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

/**
 * Page count and a page index guaranteed to be within it.
 *
 * Pulled out of the admin list because the clamp is the non-obvious part:
 * deleting the last page leaves the stored page index past the end of a shorter
 * list, and an unclamped index renders as an empty table with rows still there.
 * Always at least one page, so an empty list reports page 1 of 1 rather than 0.
 */
export function pageBounds(
  total: number,
  page: number,
  size: number = MAX_BULK_DELETE
): { pageCount: number; page: number } {
  if (size < 1) throw new Error('page size must be at least 1');
  const pageCount = Math.max(1, Math.ceil(Math.max(0, total) / size));
  return { pageCount, page: Math.min(Math.max(0, page), pageCount - 1) };
}

/**
 * Adds or removes one page's slugs, leaving the rest of the selection intact.
 *
 * The header checkbox covers the page on screen. Replacing the set instead of
 * editing it would drop everything ticked on earlier pages the moment the box
 * was touched, so a selection built across several pages could never survive.
 */
export function togglePageSelection(
  selected: ReadonlySet<string>,
  pageSlugs: readonly string[],
  select: boolean
): Set<string> {
  const next = new Set(selected);
  for (const slug of pageSlugs) {
    if (select) next.add(slug);
    else next.delete(slug);
  }
  return next;
}

/** Splits a list into consecutive runs of at most `size`. */
export function chunk<T>(items: readonly T[], size: number = MAX_BULK_DELETE): T[][] {
  if (size < 1) throw new Error('chunk size must be at least 1');
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}
