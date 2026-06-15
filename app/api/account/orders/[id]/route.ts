import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getOrderById, sanitizeOrderForCustomer } from '@/lib/orders';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const order = await getOrderById(id);

  if (!order) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Return 404 (not 403) — avoids revealing that an order with this id exists
  if (order.userId !== session.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(sanitizeOrderForCustomer(order, session.id));
}
