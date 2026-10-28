import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin, handleAdminError } from '@/lib/admin';
import { getProducts, createProduct, deleteProducts, MAX_BULK_DELETE } from '@/lib/products';
import { getCategoryNames } from '@/lib/categories';
import { type Product } from '@/data/products';

const specSchema = z.object({ label: z.string(), value: z.string() });

const productSchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, hyphens'),
  name: z.string().min(1),
  // Validated against the Category table after parsing — see below.
  category: z.string().min(1),
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
    return NextResponse.json(await getProducts());
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

    // Categories are admin-managed rows, so the allowed set comes from the
    // database rather than a hardcoded array. Previously the array was the
    // gate, which made /admin/categories a write-only UI.
    const allowed = await getCategoryNames();
    if (!allowed.includes(result.data.category)) {
      return NextResponse.json(
        { error: `Unknown category "${result.data.category}". Create it under Categories first.` },
        { status: 400 }
      );
    }

    const product = await createProduct(result.data as Omit<Product, 'id'>);
    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message.includes('slug')) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    return handleAdminError(err);
  }
}

const bulkDeleteSchema = z.object({
  slugs: z.array(z.string().min(1)).min(1).max(MAX_BULK_DELETE),
});

/**
 * Bulk delete. The per-slug route stays for single deletes; this exists so the
 * admin does not fire 200 requests to clear a filtered list, which the nginx
 * rate limit would throttle halfway through and leave half-done.
 *
 * Responds with the slugs actually removed rather than a count, so the client
 * can reconcile its list against reality instead of assuming every slug it
 * asked for existed.
 */
export async function DELETE(request: Request) {
  try {
    await requireAdmin();

    const body: unknown = await request.json();
    const parsed = bulkDeleteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: `Send between 1 and ${MAX_BULK_DELETE} product slugs.`,
          issues: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const deleted = await deleteProducts(parsed.data.slugs);
    return NextResponse.json({ deleted, count: deleted.length });
  } catch (err) {
    return handleAdminError(err);
  }
}
