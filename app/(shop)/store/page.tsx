import { getProducts } from '@/lib/products.dev';
import { getReviews } from '@/lib/reviews.dev';
import { buildRatingsMap } from '@/lib/rating';
import StoreScrollHero from '@/components/store/StoreScrollHero';
import StoreContent from '@/components/store/StoreContent';

export default function StorePage() {
  const products = getProducts();
  const approvedReviews = getReviews().filter((r) => r.status === 'approved');
  const ratings = buildRatingsMap(products, approvedReviews);

  return (
    <>
      <StoreScrollHero />
      <StoreContent products={products} ratings={ratings} />
    </>
  );
}
