import { NextResponse } from 'next/server';
import { requireAdmin, handleAdminError } from '@/lib/admin';
import { getOrders } from '@/lib/orders.dev';

export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json(getOrders());
  } catch (err) {
    return handleAdminError(err);
  }
}
