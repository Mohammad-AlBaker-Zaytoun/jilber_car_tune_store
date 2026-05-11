import { NextResponse } from 'next/server';
import { requireAdmin, handleAdminError } from '@/lib/admin';
import { getReviews } from '@/lib/reviews.dev';

/** GET /api/admin/reviews — admin only, returns all reviews including email */
export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json(getReviews());
  } catch (err) {
    return handleAdminError(err);
  }
}
