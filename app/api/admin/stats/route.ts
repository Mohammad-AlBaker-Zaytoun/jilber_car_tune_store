import { NextResponse } from 'next/server';
import { requireAdmin, handleAdminError } from '@/lib/admin';
import { countProducts } from '@/lib/products';
import { countOrders, estimatedRevenue } from '@/lib/orders';
import { countUsers } from '@/lib/users';

export async function GET() {
  try {
    await requireAdmin();

    const { total: totalProducts, active: activeProducts } = await countProducts();
    const { total: totalOrders, pending: pendingOrders } = await countOrders();
    const totalUsers = await countUsers();
    const revenue = await estimatedRevenue();

    return NextResponse.json({
      totalProducts,
      activeProducts,
      totalUsers,
      totalOrders,
      pendingOrders,
      estimatedRevenue: revenue,
    });
  } catch (err) {
    return handleAdminError(err);
  }
}
