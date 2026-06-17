import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin, handleAdminError } from '@/lib/admin';
import { getInquiries, updateInquiry } from '@/lib/inquiries';

export async function GET() {
  try {
    await requireAdmin();
    const inquiries = await getInquiries();
    return NextResponse.json(inquiries);
  } catch (err) {
    return handleAdminError(err);
  }
}

const patchSchema = z.object({
  id: z.string().min(1),
  status: z.enum(['new', 'read', 'replied']).optional(),
  adminNotes: z.string().max(4000).optional(),
});

export async function PATCH(request: Request) {
  try {
    await requireAdmin();

    const body: unknown = await request.json();
    const result = patchSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
    }

    const { id, ...updates } = result.data;
    const updated = await updateInquiry(id, updates);
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json(updated);
  } catch (err) {
    return handleAdminError(err);
  }
}
