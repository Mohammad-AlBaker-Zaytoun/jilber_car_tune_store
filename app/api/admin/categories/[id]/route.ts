import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin, handleAdminError } from '@/lib/admin';
import { updateCategory, deleteCategory, CategoryInUseError } from '@/lib/categories';

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
    const updated = await updateCategory(id, result.data);
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
    const deleted = await deleteCategory(id);
    if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    // Product.category is a plain string with no foreign key, so deleting a
    // category in use would leave those products pointing at a value no filter
    // matches — effectively hiding them from the storefront.
    if (err instanceof CategoryInUseError) {
      return NextResponse.json(
        {
          error: `Cannot delete: ${err.productCount} product(s) still use this category. Reassign them first.`,
        },
        { status: 409 }
      );
    }
    return handleAdminError(err);
  }
}
