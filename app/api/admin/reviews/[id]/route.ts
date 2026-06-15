import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin, handleAdminError } from '@/lib/admin';
import { getReviewById, updateReview, deleteReview } from '@/lib/reviews';

const statusSchema = z.object({
  status: z.enum(['pending', 'approved', 'hidden']),
});

/** PUT /api/admin/reviews/[id] — admin only, update review status */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const review = await getReviewById(id);
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    const body: unknown = await request.json();
    const result = statusSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: result.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await updateReview(id, { status: result.data.status });
    return NextResponse.json(updated);
  } catch (err) {
    return handleAdminError(err);
  }
}

/** DELETE /api/admin/reviews/[id] — admin only, delete any review */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const review = await getReviewById(id);
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    await deleteReview(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleAdminError(err);
  }
}
