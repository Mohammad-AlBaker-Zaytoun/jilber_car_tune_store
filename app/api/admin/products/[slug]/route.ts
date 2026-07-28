import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin, handleAdminError } from '@/lib/admin';
import { getProductBySlug, updateProduct, deleteProduct } from '@/lib/products';
import { getCategoryNames } from '@/lib/categories';

const specSchema = z.object({ label: z.string(), value: z.string() });

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
  // Validated against the Category table after parsing. An unchecked string
  // here could set a category no filter or listing would ever match, silently
  // hiding the product from the storefront.
  category: z.string().min(1).optional(),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  oldPrice: z.number().positive().optional().nullable(),
  currency: z.string().optional(),
  badge: z.string().optional().nullable(),
  rating: z.number().min(0).max(5).optional(),
  reviewCount: z.number().int().nonnegative().optional(),
  inStock: z.boolean().optional(),
  featured: z.boolean().optional(),
  visualColor: z.string().optional(),
  visualColor2: z.string().optional(),
  images: z.array(z.string()).optional(),
  specs: z.array(specSchema).optional(),
  compatibility: z.array(z.string()).optional(),
  includedItems: z.array(z.string()).optional(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    await requireAdmin();
    const { slug } = await params;
    const product = await getProductBySlug(slug);
    if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(product);
  } catch (err) {
    return handleAdminError(err);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    await requireAdmin();
    const { slug } = await params;
    const body: unknown = await request.json();
    const result = updateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Validation failed', issues: result.error.flatten() }, { status: 400 });
    }

    // Same DB-backed check as POST. This route previously accepted any string,
    // so an edit could set a category that no filter or listing matches.
    if (result.data.category !== undefined) {
      const allowed = await getCategoryNames();
      if (!allowed.includes(result.data.category)) {
        return NextResponse.json(
          { error: `Unknown category "${result.data.category}". Create it under Categories first.` },
          { status: 400 }
        );
      }
    }

    const updated = await updateProduct(slug, result.data as Parameters<typeof updateProduct>[1]);
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof Error && err.message.includes('slug')) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    return handleAdminError(err);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    await requireAdmin();
    const { slug } = await params;
    const deleted = await deleteProduct(slug);
    if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleAdminError(err);
  }
}
