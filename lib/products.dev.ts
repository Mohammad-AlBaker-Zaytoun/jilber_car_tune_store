/**
 * DEV-ONLY product store — JSON file on disk.
 * Seeds from data/products.ts on first run.
 * Replace with a real database before production.
 */

import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { products as staticProducts } from '@/data/products';
import type { Product } from '@/data/products';

export type { Product };

const DB_PATH = path.join(process.cwd(), '.dev-products.json');

function readStore(): Product[] {
  try {
    if (!fs.existsSync(DB_PATH)) {
      writeStore(staticProducts);
      return staticProducts;
    }
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as Product[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      writeStore(staticProducts);
      return staticProducts;
    }
    return parsed;
  } catch {
    return staticProducts;
  }
}

function writeStore(products: Product[]): void {
  fs.writeFileSync(DB_PATH, JSON.stringify(products, null, 2), 'utf-8');
}

export function getProducts(): Product[] {
  return readStore();
}

export function getProductBySlug(slug: string): Product | undefined {
  return readStore().find((p) => p.slug === slug);
}

export function getRelatedProducts(product: Product, count = 3): Product[] {
  return readStore()
    .filter((p) => p.id !== product.id && p.category === product.category)
    .slice(0, count);
}

export function getFeaturedProducts(): Product[] {
  return readStore().filter((p) => p.featured);
}

export function countProducts(): { total: number; active: number } {
  const all = readStore();
  return { total: all.length, active: all.filter((p) => p.inStock).length };
}

export function createProduct(data: Omit<Product, 'id'>): Product {
  const prods = readStore();
  if (prods.some((p) => p.slug === data.slug)) {
    throw new Error('A product with this slug already exists');
  }
  const product: Product = { ...data, id: `prod-${randomUUID().slice(0, 8)}` };
  writeStore([...prods, product]);
  return product;
}

export function updateProduct(slug: string, data: Partial<Omit<Product, 'id'>>): Product | null {
  const prods = readStore();
  const idx = prods.findIndex((p) => p.slug === slug);
  if (idx === -1) return null;
  // If slug is changing, verify new slug doesn't conflict
  if (data.slug && data.slug !== slug && prods.some((p) => p.slug === data.slug)) {
    throw new Error('A product with this slug already exists');
  }
  prods[idx] = { ...prods[idx], ...data };
  writeStore(prods);
  return prods[idx];
}

export function deleteProduct(slug: string): boolean {
  const prods = readStore();
  const filtered = prods.filter((p) => p.slug !== slug);
  if (filtered.length === prods.length) return false;
  writeStore(filtered);
  return true;
}
