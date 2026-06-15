import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getOrdersByUserId, sanitizeOrderForCustomer } from '@/lib/orders';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const orders = await getOrdersByUserId(session.id);
  return NextResponse.json(orders.map((o) => sanitizeOrderForCustomer(o, session.id)));
}
