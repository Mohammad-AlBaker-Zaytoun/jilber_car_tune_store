import { getProducts } from '@/lib/products.dev';
import StoreHero from '@/components/store/StoreHero';
import StoreContent from '@/components/store/StoreContent';

export default function StorePage() {
  const products = getProducts();
  return (
    <>
      <StoreHero />
      <StoreContent products={products} />
    </>
  );
}
