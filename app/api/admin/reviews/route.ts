import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin, handleAdminError } from '@/lib/admin';
import { getReviewsPage } from '@/lib/reviews';

/**
 * GET /api/admin/reviews?page=1&status= — admin only.
 *
 * Paginated. The response carries reviewer email addresses, so returning the
 * whole table in one payload was both a performance and a data-exposure
 * concern; a page bounds both.
 */
const querySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
  status: z.enum(['pending', 'approved', 'hidden']).optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  search: z.string().max(120).optional(),
});

export async function GET(request: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse(Object.fromEntries(searchParams));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 });
    }

    return NextResponse.json(await getReviewsPage(parsed.data));
  } catch (err) {
    return handleAdminError(err);
  }
}
