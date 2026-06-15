import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/session';
import {
  getApprovedReviewsForProduct,
  getUserReviewForProduct,
  createReview,
  AUTO_APPROVE_REVIEWS,
} from '@/lib/reviews.dev';
import { getProducts } from '@/lib/products.dev';
import { isUniqueConstraintError } from '@/lib/admin';

/** GET /api/reviews?productId=X — public, returns approved reviews only (email stripped) */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get('productId');
  if (!productId) {
    return NextResponse.json({ error: 'productId is required' }, { status: 400 });
  }
  const reviews = await getApprovedReviewsForProduct(productId);
  // Strip email before sending to client
  const safe = reviews.map(({ userEmail: _e, ...r }) => r);
  return NextResponse.json(safe);
}

const createSchema = z.object({
  productId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  comment: z.string().max(1000).optional(),
});

/** POST /api/reviews — authenticated, creates one review per user per product */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body: unknown = await request.json();
  const result = createSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: result.error.flatten() },
      { status: 400 }
    );
  }

  const { productId, rating, title, comment } = result.data;

  const product = (await getProducts()).find((p) => p.id === productId);
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  const existing = await getUserReviewForProduct(session.id, productId);
  if (existing) {
    return NextResponse.json(
      { error: 'You have already reviewed this product' },
      { status: 409 }
    );
  }

  try {
    const review = await createReview({
      productId,
      productSlug: product.slug,
      userId: session.id,
      userName: session.name,
      userEmail: session.email,
      rating,
      title: title ?? undefined,
      comment: comment ?? undefined,
      status: AUTO_APPROVE_REVIEWS ? 'approved' : 'pending',
    });
    const { userEmail: _e, ...safe } = review;
    return NextResponse.json(safe, { status: 201 });
  } catch (err) {
    if (
      isUniqueConstraintError(err) ||
      (err instanceof Error && err.message.includes('already reviewed'))
    ) {
      return NextResponse.json(
        { error: 'You have already reviewed this product' },
        { status: 409 }
      );
    }
    console.error('[reviews POST]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
