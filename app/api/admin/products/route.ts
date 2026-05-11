import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin, handleAdminError } from '@/lib/admin';
import { getProducts, createProduct } from '@/lib/products.dev';
import { CATEGORIES, type Product } from '@/data/products';

const specSchema = z.object({ label: z.string(), value: z.string() });

const productSchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, hyphens'),
  name: z.string().min(1),
  category: z.enum(CATEGORIES as unknown as [string, ...string[]]),
  shortDescription: z.string().min(1),
  description: z.string().min(1),
  price: z.number().positive(),
  oldPrice: z.number().positive().optional(),
  currency: z.string().default('USD'),
  badge: z.string().optional(),
  rating: z.number().min(0).max(5).default(0),
  reviewCount: z.number().int().nonnegative().default(0),
  inStock: z.boolean().default(true),
  featured: z.boolean().default(false),
  visualColor: z.string().default('#00d4ff'),
  visualColor2: z.string().default('#003d99'),
  images: z.array(z.string()).optional(),
  specs: z.array(specSchema).default([]),
  compatibility: z.array(z.string()).default([]),
  includedItems: z.array(z.string()).default([]),
});

export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json(getProducts());
  } catch (err) {
    return handleAdminError(err);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body: unknown = await request.json();
    const result = productSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Validation failed', issues: result.error.flatten() }, { status: 400 });
    }
    const product = createProduct(result.data as Omit<Product, 'id'>);
    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message.includes('slug')) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    return handleAdminError(err);
  }
}
