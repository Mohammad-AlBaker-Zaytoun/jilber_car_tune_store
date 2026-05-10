/**
 * DEV-ONLY category store — JSON file on disk.
 * Seeds from CATEGORIES constant in data/products.ts on first run.
 */

import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { CATEGORIES } from '@/data/products';
import type { StoredCategory } from '@/types/admin';

export type { StoredCategory };

const DB_PATH = path.join(process.cwd(), '.dev-categories.json');

const SEED: StoredCategory[] = CATEGORIES.map((name) => ({
  id: randomUUID(),
  name,
  slug: name.toLowerCase().replace(/\s+/g, '-'),
  createdAt: new Date().toISOString(),
}));

function readStore(): StoredCategory[] {
  try {
    if (!fs.existsSync(DB_PATH)) {
      writeStore(SEED);
      return SEED;
    }
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as StoredCategory[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      writeStore(SEED);
      return SEED;
    }
    return parsed;
  } catch {
    return SEED;
  }
}

function writeStore(cats: StoredCategory[]): void {
  fs.writeFileSync(DB_PATH, JSON.stringify(cats, null, 2), 'utf-8');
}

export function getCategories(): StoredCategory[] {
  return readStore();
}

export function getCategoryBySlug(slug: string): StoredCategory | null {
  return readStore().find((c) => c.slug === slug) ?? null;
}

export function createCategory(data: Omit<StoredCategory, 'id' | 'createdAt'>): StoredCategory {
  const cats = readStore();
  if (cats.some((c) => c.slug === data.slug)) {
    throw new Error('A category with this slug already exists');
  }
  const cat: StoredCategory = { ...data, id: randomUUID(), createdAt: new Date().toISOString() };
  writeStore([...cats, cat]);
  return cat;
}

export function updateCategory(id: string, data: Partial<Omit<StoredCategory, 'id' | 'createdAt'>>): StoredCategory | null {
  const cats = readStore();
  const idx = cats.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  if (data.slug && data.slug !== cats[idx].slug && cats.some((c) => c.slug === data.slug)) {
    throw new Error('A category with this slug already exists');
  }
  cats[idx] = { ...cats[idx], ...data };
  writeStore(cats);
  return cats[idx];
}

export function deleteCategory(id: string): boolean {
  const cats = readStore();
  const filtered = cats.filter((c) => c.id !== id);
  if (filtered.length === cats.length) return false;
  writeStore(filtered);
  return true;
}
