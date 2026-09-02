import type { Product } from '@/data/products';

export type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'rating';

/** Effective customer ratings, keyed by product id (see lib/rating.ts). */
export type RatingMap = Record<string, { rating: number; count: number }> | undefined;

/**
 * Orders the storefront grid.
 *
 * AVAILABILITY OUTRANKS THE CHOSEN SORT. Whatever the customer picked —
 * price, rating, featured — anything they cannot actually buy sinks below
 * everything they can. Sorting purely by the selected key put out-of-stock
 * items at the very top of the catalogue (676 of the 1,901 products are
 * currently unavailable), so the first thing a visitor met was three products
 * with a disabled "OUT OF STOCK" button.
 *
 * Within each availability group the selected sort applies normally, so
 * "price: low to high" still reads low-to-high across the in-stock items and
 * then low-to-high again across the out-of-stock ones.
 *
 * Array.prototype.sort is stable, so products that tie keep the order the
 * server sent them in rather than shuffling between renders.
 */
export function compareProducts(sort: SortOption, ratings?: RatingMap) {
  return (a: Product, b: Product): number => {
    if (a.inStock !== b.inStock) return a.inStock ? -1 : 1;

    switch (sort) {
      case 'price-asc':
        return a.price - b.price;
      case 'price-desc':
        return b.price - a.price;
      case 'rating': {
        const aRating = ratings?.[a.id]?.rating ?? a.rating;
        const bRating = ratings?.[b.id]?.rating ?? b.rating;
        return bRating - aRating;
      }
      default:
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    }
  };
}
