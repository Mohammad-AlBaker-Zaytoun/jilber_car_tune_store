import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createOrder } from '@/lib/orders.dev';
import { getSession } from '@/lib/session';

const itemSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  category: z.string(),
  price: z.number().positive(),
  currency: z.string(),
  quantity: z.number().int().positive(),
  visualColor: z.string(),
});

const schema = z.object({
  ref: z.string(),
  customer: z.object({
    fullName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(1),
    address: z.string().default(''),
  }),
  vehicle: z.object({
    make: z.string().min(1),
    model: z.string().min(1),
    year: z.string().min(1),
    engine: z.string().default(''),
    currentMods: z.string().default(''),
    serviceDate: z.string().default(''),
  }),
  items: z.array(itemSchema).min(1),
  payment: z.string(),
  subtotal: z.number().nonnegative(),
  tax: z.number().nonnegative(),
  total: z.number().nonnegative(),
});

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid order data' }, { status: 400 });
    }

    const session = await getSession();
    const order = createOrder({ ...result.data, userId: session?.id });

    return NextResponse.json({ orderId: order.id, ref: order.ref }, { status: 201 });
  } catch (err) {
    console.error('[orders/POST]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
