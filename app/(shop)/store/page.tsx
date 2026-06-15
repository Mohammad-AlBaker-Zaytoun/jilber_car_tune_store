import type { Metadata } from 'next';
import { getProducts } from '@/lib/products.dev';
import { getReviews } from '@/lib/reviews.dev';
import { buildRatingsMap } from '@/lib/rating';
import StoreScrollHero from '@/components/store/StoreScrollHero';
import StoreContent from '@/components/store/StoreContent';
import { siteConfig } from '@/lib/seo/site-config';
import { absoluteUrl } from '@/lib/seo/helpers';

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

export default async function StorePage() {
  const [products, allReviews] = await Promise.all([getProducts(), getReviews()]);
  const approvedReviews = allReviews.filter((r) => r.status === 'approved');
  const ratings = buildRatingsMap(products, approvedReviews);

  return (
    <>
      <StoreScrollHero />
      <StoreContent products={products} ratings={ratings} />
    </>
  );
}
