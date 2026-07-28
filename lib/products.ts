/**
 * Product repository — MSSQL via Prisma.
 *
 * Public function names/signatures are unchanged from the old JSON store; only
 * the internals (and the now-async return types) differ. Array fields
 * (specs/compatibility/includedItems/images) are stored as JSON strings and
 * mapped back to arrays here so the returned objects satisfy the `Product` type.
 */

import { randomUUID } from 'crypto';
import { cache } from 'react';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logger';
import type { Product as ProductRow } from '@prisma/client';
import type { Product, ProductSpec, Category } from '@/data/products';

export type { Product };

/**
 * Parses one of the JSON-string array columns.
 *
 * MSSQL has no array type, so specs/compatibility/includedItems/images are
 * stored as JSON strings (see the note at the top of schema.prisma). A bare
 * JSON.parse meant a single malformed row — a bad import, a manual edit, a
 * truncated write — threw and took down the ENTIRE product listing, not just
 * that product. Degrade to an empty array and log instead.
 */
function parseJsonArray<T>(value: string, field: string, slug: string): T[] {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      logger.warn('product.json_column_not_array', { slug, field });
      return [];
    }
    return parsed as T[];
  } catch {
    logger.error('product.json_column_malformed', undefined, {
      slug,
      field,
      preview: value?.slice(0, 120),
    });
    return [];
  }
}

function rowToProduct(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category as Category,
    shortDescription: row.shortDescription,
    description: row.description,
    price: Number(row.price),
    oldPrice: row.oldPrice == null ? undefined : Number(row.oldPrice),
    currency: row.currency,
    badge: row.badge ?? undefined,
    rating: row.rating,
    reviewCount: row.reviewCount,
    inStock: row.inStock,
    featured: row.featured,
    images: parseJsonArray<string>(row.images, 'images', row.slug),
    visualColor: row.visualColor,
    visualColor2: row.visualColor2,
    specs: parseJsonArray<ProductSpec>(row.specs, 'specs', row.slug),
    compatibility: parseJsonArray<string>(row.compatibility, 'compatibility', row.slug),
    includedItems: parseJsonArray<string>(row.includedItems, 'includedItems', row.slug),
  };
}

/** Map the array fields of a Product to their JSON-string column form. */
function productWriteData(data: Partial<Omit<Product, 'id'>>) {
  const { specs, compatibility, includedItems, images, oldPrice, ...rest } = data;
  return {
    ...rest,
    ...(oldPrice !== undefined ? { oldPrice } : {}),
    ...(specs !== undefined ? { specs: JSON.stringify(specs) } : {}),
    ...(compatibility !== undefined ? { compatibility: JSON.stringify(compatibility) } : {}),
    ...(includedItems !== undefined ? { includedItems: JSON.stringify(includedItems) } : {}),
    ...(images !== undefined ? { images: JSON.stringify(images) } : {}),
  };
}

export async function getProducts(): Promise<Product[]> {
  const rows = await prisma.product.findMany({ orderBy: { name: 'asc' } });
  return rows.map(rowToProduct);
}

/**
 * Wrapped in React's `cache()` so repeated calls within a single request hit the
 * database once. `/store/[slug]` calls this twice per render — once in
 * generateMetadata and again in the page body — which was two identical queries
 * on every product view. The cache is per-request, so there is no staleness.
 */
export const getProductBySlug = cache(
  async (slug: string): Promise<Product | undefined> => {
    const row = await prisma.product.findUnique({ where: { slug } });
    return row ? rowToProduct(row) : undefined;
  }
);

export async function getProductById(id: string): Promise<Product | undefined> {
  const row = await prisma.product.findUnique({ where: { id } });
  return row ? rowToProduct(row) : undefined;
}

/**
 * Resolves many products in ONE query, keyed by slug.
 *
 * Checkout previously awaited getProductBySlug() inside a loop, so a 50-item
 * cart (the schema maximum) cost 50 sequential MSSQL round trips before the
 * order was written.
 */
export async function getProductsBySlugs(slugs: string[]): Promise<Map<string, Product>> {
  if (slugs.length === 0) return new Map();
  const rows = await prisma.product.findMany({
    where: { slug: { in: [...new Set(slugs)] } },
  });
  return new Map(rows.map((row) => [row.slug, rowToProduct(row)]));
}

export async function getRelatedProducts(product: Product, count = 3): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    where: { category: product.category, id: { not: product.id } },
    take: count,
  });
  return rows.map(rowToProduct);
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    where: { featured: true },
    orderBy: { name: 'asc' },
  });
  return rows.map(rowToProduct);
}

export async function countProducts(): Promise<{ total: number; active: number }> {
  const [total, active] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { inStock: true } }),
  ]);
  return { total, active };
}

export async function createProduct(data: Omit<Product, 'id'>): Promise<Product> {
  const existing = await prisma.product.findUnique({ where: { slug: data.slug } });
  if (existing) throw new Error('A product with this slug already exists');

  const row = await prisma.product.create({
    data: {
      id: `prod-${randomUUID().slice(0, 8)}`,
      slug: data.slug,
      name: data.name,
      category: data.category,
      shortDescription: data.shortDescription,
      description: data.description,
      price: data.price,
      oldPrice: data.oldPrice ?? null,
      currency: data.currency,
      badge: data.badge ?? null,
      rating: data.rating,
      reviewCount: data.reviewCount,
      inStock: data.inStock,
      featured: data.featured,
      visualColor: data.visualColor,
      visualColor2: data.visualColor2,
      specs: JSON.stringify(data.specs ?? []),
      compatibility: JSON.stringify(data.compatibility ?? []),
      includedItems: JSON.stringify(data.includedItems ?? []),
      images: JSON.stringify(data.images ?? []),
    },
  });
  return rowToProduct(row);
}

export async function updateProduct(
  slug: string,
  data: Partial<Omit<Product, 'id'>>
): Promise<Product | null> {
  const current = await prisma.product.findUnique({ where: { slug } });
  if (!current) return null;

  if (data.slug && data.slug !== slug) {
    const conflict = await prisma.product.findUnique({ where: { slug: data.slug } });
    if (conflict) throw new Error('A product with this slug already exists');
  }

  const row = await prisma.product.update({
    where: { slug },
    data: productWriteData(data),
  });
  return rowToProduct(row);
}

/**
 * Deletes a product and the reviews attached to it.
 *
 * `Review.productId` is a plain string with no foreign key and no cascade, so
 * deleting a product used to leave its reviews behind: they stayed visible in
 * /admin/reviews pointing at a product that no longer exists, and the
 * `@@unique([userId, productId])` constraint then blocked a user from reviewing
 * a re-created product that reused the id.
 *
 * Both statements run in one transaction so a product can never be removed
 * while its reviews survive.
 */
export async function deleteProduct(slug: string): Promise<boolean> {
  try {
    const product = await prisma.product.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!product) return false;

    await prisma.$transaction([
      prisma.review.deleteMany({ where: { productId: product.id } }),
      prisma.product.delete({ where: { slug } }),
    ]);
    return true;
  } catch {
    return false;
  }
}
