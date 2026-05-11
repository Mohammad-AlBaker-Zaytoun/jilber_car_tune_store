import { getProducts } from '@/lib/products.dev';
import StoreScrollHero from '@/components/store/StoreScrollHero';
import StoreContent from '@/components/store/StoreContent';

export default function StorePage() {
  const products = getProducts();
  return (
    <>
      <StoreScrollHero />
      <StoreContent products={products} />
    </>
  );
}
