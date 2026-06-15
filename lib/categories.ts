/**
 * Category repository — MSSQL via Prisma.
 * Public function names/signatures unchanged from the old JSON store.
 */

import { randomUUID } from 'crypto';
import { prisma } from '@/lib/db/prisma';
import type { Category as CategoryRow } from '@prisma/client';
import type { StoredCategory } from '@/types/admin';

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

export async function deleteCategory(id: string): Promise<boolean> {
  try {
    await prisma.category.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}
