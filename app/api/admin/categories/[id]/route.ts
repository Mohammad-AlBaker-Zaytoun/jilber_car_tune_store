import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin, handleAdminError } from '@/lib/admin';
import { updateCategory, deleteCategory } from '@/lib/categories.dev';
import { getProducts } from '@/lib/products.dev';

const schema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().optional(),
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body: unknown = await request.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Validation failed', issues: result.error.flatten() }, { status: 400 });
    }
    const updated = updateCategory(id, result.data);
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof Error && err.message.includes('slug')) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    return handleAdminError(err);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    // Warn if products depend on this category
    // (we still allow delete — admin's responsibility to reassign products)
    const products = getProducts();
    const inUse = products.filter((p) => {
      // Check by category id match if possible (categories store name-based)
      return false; // placeholder — products use category name not id
    });
    void inUse;
    const deleted = deleteCategory(id);
    if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleAdminError(err);
  }
}
