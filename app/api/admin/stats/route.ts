import { NextResponse } from 'next/server';
import { requireAdmin, handleAdminError } from '@/lib/admin';
import { countProducts } from '@/lib/products';
import { countOrders, estimatedRevenue } from '@/lib/orders';
import { countUsers } from '@/lib/users';
import { countNewInquiries } from '@/lib/inquiries';

export async function GET() {
  try {
    await requireAdmin();

    const [
      { total: totalProducts, active: activeProducts },
      { total: totalOrders, pending: pendingOrders },
      totalUsers,
      revenue,
      newInquiries,
    ] = await Promise.all([
      countProducts(),
      countOrders(),
      countUsers(),
      estimatedRevenue(),
      countNewInquiries(),
    ]);

    return NextResponse.json({
      totalProducts,
      activeProducts,
      totalUsers,
      totalOrders,
      pendingOrders,
      estimatedRevenue: revenue,
      newInquiries,
    });
  } catch (err) {
    return handleAdminError(err);
  }
}
