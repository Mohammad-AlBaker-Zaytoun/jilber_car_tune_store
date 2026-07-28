import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin, handleAdminError } from '@/lib/admin';
import { getOrdersPage } from '@/lib/orders';

/**
 * GET /api/admin/orders?page=1&pageSize=25&status=&paymentStatus=&search=
 *
 * Returns a page, not the whole table. This previously loaded every order with
 * every line item and every status-history row into a single JSON response and
 * let the browser filter — fine at demo scale, a guaranteed timeout as history
 * accumulates.
 */
const querySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
  status: z.string().max(40).optional(),
  paymentStatus: z.string().max(40).optional(),
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

    return NextResponse.json(await getOrdersPage(parsed.data));
  } catch (err) {
    return handleAdminError(err);
  }
}
