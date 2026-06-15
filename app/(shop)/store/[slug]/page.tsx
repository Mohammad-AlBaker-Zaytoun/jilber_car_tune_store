import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProductBySlug } from '@/lib/products.dev';
import { getSession } from '@/lib/session';
import { getApprovedReviewsForProduct, getUserReviewForProduct } from '@/lib/reviews.dev';
import type { PublicReview } from '@/lib/reviews.dev';
import ProductDetails from '@/components/store/ProductDetails';
import { getEffectiveRating } from '@/lib/rating';
import {
  absoluteUrl,
  buildBreadcrumbJsonLd,
  buildProductJsonLd,
  safeJsonLd,
  truncateDescription,
} from '@/lib/seo/helpers';
import { siteConfig } from '@/lib/seo/site-config';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: 'Product Not Found' };

  const description = truncateDescription(
    product.shortDescription || product.description,
  );
  const productUrl = absoluteUrl(`/store/${product.slug}`);
  const ogImage = product.images?.[0]
    ? absoluteUrl(product.images[0])
    : siteConfig.defaultOgImage;

  const fullTitle = `${product.name} | Performance Parts Store`;

  return {
    title: { absolute: fullTitle },
    description,
    alternates: {
      canonical: productUrl,
    },
    openGraph: {
      title: fullTitle,
      description,
      url: productUrl,
      type: 'website',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [ogImage],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const session = await getSession();

  const approvedReviews = await getApprovedReviewsForProduct(product.id);
  const initialReviews: PublicReview[] = approvedReviews.map(
    ({ userEmail: _e, ...r }) => r,
  );

  let userReview: PublicReview | null = null;
  if (session) {
    const raw = await getUserReviewForProduct(session.id, product.id);
    if (raw) {
      const { userEmail: _e, ...pub } = raw;
      userReview = pub;
    }
  }

  const effectiveRating = getEffectiveRating(product, approvedReviews);

  const productJsonLd = buildProductJsonLd(
    product,
    effectiveRating.source !== 'none' ? effectiveRating : undefined,
  );

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: 'Home', url: siteConfig.siteUrl },
    { name: 'Store', url: absoluteUrl('/store') },
    { name: product.name, url: absoluteUrl(`/store/${product.slug}`) },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }}
      />
      <ProductDetails
        product={product}
        session={session}
        initialReviews={initialReviews}
        userReview={userReview}
      />
    </>
  );
}
