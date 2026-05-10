import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin, handleAdminError } from '@/lib/admin';
import { getCategories, createCategory } from '@/lib/categories.dev';

const schema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, hyphens'),
  description: z.string().optional(),
});

export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json(getCategories());
  } catch (err) {
    return handleAdminError(err);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body: unknown = await request.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Validation failed', issues: result.error.flatten() }, { status: 400 });
    }
    const cat = createCategory(result.data);
    return NextResponse.json(cat, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message.includes('slug')) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    return handleAdminError(err);
  }
}
