import { NextResponse } from 'next/server';
import { requireAdmin, handleAdminError } from '@/lib/admin';
import { countProducts } from '@/lib/products.dev';
import { countOrders, estimatedRevenue } from '@/lib/orders.dev';
import { countUsers } from '@/lib/users.dev';

export async function GET() {
  try {
    await requireAdmin();

    const { total: totalProducts, active: activeProducts } = countProducts();
    const { total: totalOrders, pending: pendingOrders } = countOrders();
    const totalUsers = countUsers();
    const revenue = estimatedRevenue();

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
