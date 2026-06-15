import type { Product } from '@/data/products';
import type { Review } from './reviews';

export interface EffectiveRating {
  rating: number;
  reviewCount: number;
  /** 'customer' = from approved reviews; 'admin' = product fallback; 'none' = no rating at all */
  source: 'customer' | 'admin' | 'none';
}

export function calculateAverageRating(reviews: Pick<Review, 'rating'>[]): number {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

/**
 * Returns the effective rating to display for a product.
 *
 * Priority:
 *  1. Customer-average of approved reviews (if any exist).
 *  2. Admin-managed product.rating / product.reviewCount (fallback).
 *  3. Zero / none (if neither source provides data).
 */
export function getEffectiveRating(
  product: Pick<Product, 'rating' | 'reviewCount'>,
  approvedReviews: Pick<Review, 'rating'>[]
): EffectiveRating {
  if (approvedReviews.length > 0) {
    return {
      rating: calculateAverageRating(approvedReviews),
      reviewCount: approvedReviews.length,
      source: 'customer',
    };
  }
  if (product.rating > 0 && product.reviewCount > 0) {
    return {
      rating: product.rating,
      reviewCount: product.reviewCount,
      source: 'admin',
    };
  }
  return { rating: 0, reviewCount: 0, source: 'none' };
}

/**
 * Builds a map of productId → effective rating for a batch of products.
 * Used by the store listing page to compute ratings server-side.
 */
export function buildRatingsMap(
  products: Pick<Product, 'id' | 'rating' | 'reviewCount'>[],
  allApprovedReviews: Pick<Review, 'productId' | 'rating'>[]
): Record<string, { rating: number; count: number }> {
  const result: Record<string, { rating: number; count: number }> = {};
  for (const product of products) {
    const productReviews = allApprovedReviews.filter((r) => r.productId === product.id);
    const eff = getEffectiveRating(product, productReviews);
    result[product.id] = { rating: eff.rating, count: eff.reviewCount };
  }
  return result;
}
