import type { Metadata } from 'next';
import { getProducts } from '@/lib/products';
import { getApprovedReviews } from '@/lib/reviews';
import { buildRatingsMap } from '@/lib/rating';
import StoreScrollHero from '@/components/store/StoreScrollHero';
import StoreContent from '@/components/store/StoreContent';
import { siteConfig } from '@/lib/seo/site-config';
import { absoluteUrl } from '@/lib/seo/helpers';
import { getCategoryNames } from '@/lib/categories';

export const metadata: Metadata = {
  title: 'Performance Parts Store',
  description:
    'Shop performance parts, tuning packages, exhaust systems, suspension upgrades, wheels, brakes, aero kits, and diagnostics services.',
  alternates: {
    canonical: absoluteUrl('/store'),
  },
  openGraph: {
    title: 'Performance Parts Store | ' + siteConfig.siteName,
    description:
      'Shop performance parts, tuning packages, exhaust systems, suspension upgrades, wheels, brakes, aero kits, and diagnostics services.',
    url: absoluteUrl('/store'),
    type: 'website',
  },
};

/**
 * ISR, 60s.
 *
 * This page was prerendered at BUILD TIME with no revalidation, so a product
 * added or edited in /admin/products never appeared on the storefront until the
 * next deploy — the admin panel looked like it worked and silently did nothing.
 * 60s bounds that staleness while still collapsing ~every request down to one
 * DB round trip per minute.
 */
export const revalidate = 60;

export default async function StorePage() {
  // Filter in SQL, not JS. This previously pulled the entire reviews table
  // (including every reviewer's email) and discarded the non-approved rows in
  // memory, bypassing the reviews_status_idx that exists for this query.
  const [products, approvedReviews, categories] = await Promise.all([
    getProducts(),
    getApprovedReviews(),
    getCategoryNames(),
  ]);
  const ratings = buildRatingsMap(products, approvedReviews);

  return (
    <>
      <StoreScrollHero />
      <StoreContent products={products} categories={categories} ratings={ratings} />
    </>
  );
}
