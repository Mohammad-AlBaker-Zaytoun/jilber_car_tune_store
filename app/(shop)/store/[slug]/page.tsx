import { notFound } from 'next/navigation';
import { getProductBySlug } from '@/lib/products.dev';
import { getSession } from '@/lib/session';
import { getApprovedReviewsForProduct, getUserReviewForProduct } from '@/lib/reviews.dev';
import type { PublicReview } from '@/lib/reviews.dev';
import ProductDetails from '@/components/store/ProductDetails';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return {};
  return {
    title: `${product.name} | JILBER Store`,
    description: product.shortDescription,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  const session = await getSession();

  const approvedReviews = getApprovedReviewsForProduct(product.id);
  const initialReviews: PublicReview[] = approvedReviews.map(
    ({ userEmail: _e, ...r }) => r
  );

  let userReview: PublicReview | null = null;
  if (session) {
    const raw = getUserReviewForProduct(session.id, product.id);
    if (raw) {
      const { userEmail: _e, ...pub } = raw;
      userReview = pub;
    }
  }

  return (
    <ProductDetails
      product={product}
      session={session}
      initialReviews={initialReviews}
      userReview={userReview}
    />
  );
}
