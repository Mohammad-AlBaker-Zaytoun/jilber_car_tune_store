import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/session';
import { getReviewById, updateReview, deleteReview } from '@/lib/reviews.dev';

const updateSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  title: z.string().max(120).optional(),
  comment: z.string().max(1000).optional(),
});

/** PUT /api/reviews/[id] — authenticated, user can only update their own review */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const review = await getReviewById(id);
  if (!review) {
    return NextResponse.json({ error: 'Review not found' }, { status: 404 });
  }
  if (review.userId !== session.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body: unknown = await request.json();
  const result = updateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: result.error.flatten() },
      { status: 400 }
    );
  }

  const updated = await updateReview(id, result.data);
  if (!updated) {
    return NextResponse.json({ error: 'Review not found' }, { status: 404 });
  }
  const { userEmail: _e, ...safe } = updated;
  return NextResponse.json(safe);
}

/** DELETE /api/reviews/[id] — authenticated, user can only delete their own review */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const review = await getReviewById(id);
  if (!review) {
    return NextResponse.json({ error: 'Review not found' }, { status: 404 });
  }
  if (review.userId !== session.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await deleteReview(id);
  return NextResponse.json({ success: true });
}
