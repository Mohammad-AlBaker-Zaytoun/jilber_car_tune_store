import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin, handleAdminError } from '@/lib/admin';
import { getOrderById, updateOrderStatus, updateOrderNotes } from '@/lib/orders.dev';

const schema = z.object({
  status: z.enum(['pending', 'confirmed', 'in-progress', 'completed', 'cancelled']).optional(),
  notes: z.string().optional(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const order = getOrderById(id);
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(order);
  } catch (err) {
    return handleAdminError(err);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body: unknown = await request.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
    }

    let order = getOrderById(id);
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (result.data.status) {
      order = updateOrderStatus(id, result.data.status) ?? order;
    }
    if (result.data.notes !== undefined) {
      order = updateOrderNotes(id, result.data.notes) ?? order;
    }

    return NextResponse.json(order);
  } catch (err) {
    return handleAdminError(err);
  }
}
