import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin, handleAdminError } from '@/lib/admin';
import { listUsersPage } from '@/lib/users';

/**
 * GET /api/admin/users?page=1&search=&role= — admin only.
 * Paginated; never returns password hashes.
 */
const querySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().max(120).optional(),
  role: z.enum(['user', 'admin']).optional(),
});

export async function GET(request: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse(Object.fromEntries(searchParams));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 });
    }

    return NextResponse.json(await listUsersPage(parsed.data));
  } catch (err) {
    return handleAdminError(err);
  }
}
