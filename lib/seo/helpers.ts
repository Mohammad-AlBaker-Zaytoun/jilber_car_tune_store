import { siteConfig } from './site-config';
import type { Product } from '@/data/products';

export function absoluteUrl(path: string): string {
  const base = siteConfig.siteUrl.replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export function truncateDescription(text: string, maxLen = 155): string {
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen - 1).trimEnd()}…`;
}

/** Serialises a JSON-LD object, replacing < to prevent XSS via script injection. */
export function safeJsonLd(obj: unknown): string {
  return JSON.stringify(obj).replace(/</g, '\\u003c');
}

interface Crumb {
  name: string;
  url: string;
}

export function buildBreadcrumbJsonLd(crumbs: Crumb[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
}

interface OrgContactOverrides {
  telephone?: string;
  email?: string;
  address?: string;
}

/**
 * Pass real values from getSettings() at call-site so search engines never
 * receive the siteConfig placeholder strings.
 */
export function buildOrganizationJsonLd(contact: OrgContactOverrides = {}) {
  const ld: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'AutoRepair',
    name: siteConfig.businessName,
    url: siteConfig.siteUrl,
    image: absoluteUrl(siteConfig.defaultOgImage),
    description: siteConfig.siteDescription,
  };
  if (contact.telephone) ld.telephone = contact.telephone;
  if (contact.email) ld.email = contact.email;
  if (contact.address) {
    ld.address = { '@type': 'PostalAddress', streetAddress: contact.address };
  }
  return ld;
}

export interface EffectiveRating {
  rating: number;
  reviewCount: number;
}

export function buildProductJsonLd(
  product: Product,
  effectiveRating?: EffectiveRating,
) {
  const productUrl = absoluteUrl(`/store/${product.slug}`);
  const image = product.images?.[0]
    ? absoluteUrl(product.images[0])
    : absoluteUrl(siteConfig.defaultOgImage);

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image,
    brand: {
      '@type': 'Brand',
      name: siteConfig.businessName,
    },
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: product.currency,
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: productUrl,
    },
  };

  if (
    effectiveRating &&
    effectiveRating.rating > 0 &&
    effectiveRating.reviewCount > 0
  ) {
    jsonLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: effectiveRating.rating,
      reviewCount: effectiveRating.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return jsonLd;
}
