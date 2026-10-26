import type { Product } from '@/data/products';

/**
 * The slice of a Product the storefront grid actually renders.
 *
 * /store hands its whole catalogue to a client component (search, category and
 * sort are client-side so the page can stay ISR). That used to be the full
 * Product — long HTML-derived descriptions, specs, fitment lists, every image —
 * serialised into the RSC payload for ~1,900 products, ~15 MB per load, and the
 * supplier catalogue import in Oct 2026 more than doubled the product count.
 * Only these fields reach the browser now; the detail page still loads the
 * full record by slug.
 */
export type ListingProduct = Pick<
  Product,
  | 'id'
  | 'slug'
  | 'name'
  | 'category'
  | 'shortDescription'
  | 'price'
  | 'oldPrice'
  | 'currency'
  | 'badge'
  | 'rating'
  | 'reviewCount'
  | 'inStock'
  | 'featured'
  | 'images'
  | 'visualColor'
  | 'visualColor2'
>;

/** Cards clamp the blurb to two lines; anything past this is never seen. */
export const LISTING_SHORT_DESCRIPTION_MAX = 180;

export function toListingProduct(p: Product): ListingProduct {
  const short = p.shortDescription ?? '';
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    category: p.category,
    shortDescription:
      short.length > LISTING_SHORT_DESCRIPTION_MAX
        ? short.slice(0, LISTING_SHORT_DESCRIPTION_MAX - 1).trimEnd() + '…'
        : short,
    price: p.price,
    ...(p.oldPrice !== undefined ? { oldPrice: p.oldPrice } : {}),
    currency: p.currency,
    ...(p.badge !== undefined ? { badge: p.badge } : {}),
    rating: p.rating,
    reviewCount: p.reviewCount,
    inStock: p.inStock,
    featured: p.featured,
    // The card shows one image; the cart thumbnail uses the same first one.
    images: p.images?.length ? [p.images[0]] : [],
    visualColor: p.visualColor,
    visualColor2: p.visualColor2,
  };
}
