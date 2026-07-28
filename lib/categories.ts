/**
 * Category repository — MSSQL via Prisma.
 * Public function names/signatures unchanged from the old JSON store.
 */

import { randomUUID } from 'crypto';
import { prisma } from '@/lib/db/prisma';
import type { Category as CategoryRow } from '@prisma/client';
import type { StoredCategory } from '@/types/admin';
import { CATEGORIES } from '@/data/products';

export type { StoredCategory };

function rowToCategory(row: CategoryRow): StoredCategory {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getCategories(): Promise<StoredCategory[]> {
  const rows = await prisma.category.findMany({ orderBy: { createdAt: 'asc' } });
  return rows.map(rowToCategory);
}

/**
 * The category names a product is allowed to use — the single source of truth
 * for both validation and every category dropdown/filter in the UI.
 *
 * Falls back to the bootstrap list in data/products.ts when the table is empty
 * (fresh database, before `npm run db:seed`), so the store is never left with an
 * unusable category field.
 */
export async function getCategoryNames(): Promise<string[]> {
  const rows = await prisma.category.findMany({
    orderBy: { createdAt: 'asc' },
    select: { name: true },
  });
  return rows.length > 0 ? rows.map((r) => r.name) : [...CATEGORIES];
}

/** How many products currently reference this category name. */
export async function countProductsInCategory(name: string): Promise<number> {
  return prisma.product.count({ where: { category: name } });
}

export async function getCategoryBySlug(slug: string): Promise<StoredCategory | null> {
  const row = await prisma.category.findUnique({ where: { slug } });
  return row ? rowToCategory(row) : null;
}

export async function createCategory(
  data: Omit<StoredCategory, 'id' | 'createdAt'>
): Promise<StoredCategory> {
  const existing = await prisma.category.findUnique({ where: { slug: data.slug } });
  if (existing) throw new Error('A category with this slug already exists');

  const row = await prisma.category.create({
    data: { id: randomUUID(), name: data.name, slug: data.slug, description: data.description },
  });
  return rowToCategory(row);
}

export async function updateCategory(
  id: string,
  data: Partial<Omit<StoredCategory, 'id' | 'createdAt'>>
): Promise<StoredCategory | null> {
  const current = await prisma.category.findUnique({ where: { id } });
  if (!current) return null;

  if (data.slug && data.slug !== current.slug) {
    const conflict = await prisma.category.findUnique({ where: { slug: data.slug } });
    if (conflict) throw new Error('A category with this slug already exists');
  }

  const row = await prisma.category.update({
    where: { id },
    data: { name: data.name, slug: data.slug, description: data.description },
  });
  return rowToCategory(row);
}

export class CategoryInUseError extends Error {
  constructor(public readonly productCount: number) {
    super(`Category is used by ${productCount} product(s)`);
    this.name = 'CategoryInUseError';
  }
}

/**
 * Deletes a category, refusing if any product still uses it.
 *
 * `Product.category` is a plain string with no foreign key, so an unguarded
 * delete left products pointing at a category that no filter or listing would
 * ever match — silently hiding them from the storefront.
 */
export async function deleteCategory(id: string): Promise<boolean> {
  const current = await prisma.category.findUnique({ where: { id } });
  if (!current) return false;

  const inUse = await countProductsInCategory(current.name);
  if (inUse > 0) throw new CategoryInUseError(inUse);

  try {
    await prisma.category.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}
