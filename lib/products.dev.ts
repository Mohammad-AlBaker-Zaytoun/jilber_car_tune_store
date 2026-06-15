/**
 * Product repository — MSSQL via Prisma.
 *
 * Public function names/signatures are unchanged from the old JSON store; only
 * the internals (and the now-async return types) differ. Array fields
 * (specs/compatibility/includedItems/images) are stored as JSON strings and
 * mapped back to arrays here so the returned objects satisfy the `Product` type.
 */

import { randomUUID } from 'crypto';
import { prisma } from '@/lib/db/prisma';
import type { Product as ProductRow } from '@prisma/client';
import type { Product, ProductSpec, Category } from '@/data/products';

export type { Product };

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
    images: JSON.parse(row.images) as string[],
    visualColor: row.visualColor,
    visualColor2: row.visualColor2,
    specs: JSON.parse(row.specs) as ProductSpec[],
    compatibility: JSON.parse(row.compatibility) as string[],
    includedItems: JSON.parse(row.includedItems) as string[],
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
  const rows = await prisma.product.findMany();
  return rows.map(rowToProduct);
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const row = await prisma.product.findUnique({ where: { slug } });
  return row ? rowToProduct(row) : undefined;
}

export async function getRelatedProducts(product: Product, count = 3): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    where: { category: product.category, id: { not: product.id } },
    take: count,
  });
  return rows.map(rowToProduct);
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const rows = await prisma.product.findMany({ where: { featured: true } });
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

export async function deleteProduct(slug: string): Promise<boolean> {
  try {
    await prisma.product.delete({ where: { slug } });
    return true;
  } catch {
    return false;
  }
}
