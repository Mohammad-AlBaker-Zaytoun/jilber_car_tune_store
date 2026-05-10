import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin, handleAdminError } from '@/lib/admin';
import { getSettings, updateSettings } from '@/lib/settings.dev';

const schema = z.object({
  shopName: z.string().min(1).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  currency: z.string().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  bookingMessage: z.string().optional(),
});

export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json(getSettings());
  } catch (err) {
    return handleAdminError(err);
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin();
    const body: unknown = await request.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Validation failed', issues: result.error.flatten() }, { status: 400 });
    }
    const settings = updateSettings(result.data);
    return NextResponse.json(settings);
  } catch (err) {
    return handleAdminError(err);
  }
}
