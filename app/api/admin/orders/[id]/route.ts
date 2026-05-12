import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin, handleAdminError } from '@/lib/admin';
import {
  getOrderById,
  updateOrderStatus,
  updateOrderAdminNotes,
  updateOrderCustomerNotes,
  updatePaymentStatus,
} from '@/lib/orders.dev';
import { canTransition } from '@/components/admin/orderStatus';
import {
  notifyOrderStatusChanged,
  notifyOrderReadyForPickup,
  notifyOrderConfirmed,
  notifyOrderCancelled,
} from '@/lib/order-notifications';

const schema = z.object({
  status: z
    .enum([
      'pending',
      'confirmed',
      'awaiting_vehicle',
      'in_progress',
      'ready_for_pickup',
      'completed',
      'cancelled',
    ])
    .optional(),
  paymentStatus: z
    .enum(['unpaid', 'deposit_pending', 'deposit_paid', 'paid', 'refunded', 'not_required'])
    .optional(),
  adminNotes: z.string().max(5000).optional(),
  customerNotes: z.string().max(2000).optional(),
  // Optional note attached to a status change (goes into history)
  statusNote: z.string().max(500).optional(),
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
    const admin = await requireAdmin();
    const { id } = await params;

    const body: unknown = await request.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
    }

    let order = getOrderById(id);
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const { status, paymentStatus, adminNotes, customerNotes, statusNote } = result.data;

    // Status change
    if (status && status !== order.status) {
      if (!canTransition(order.status, status)) {
        return NextResponse.json(
          {
            error: `Cannot transition from "${order.status}" to "${status}". Check allowed transitions.`,
          },
          { status: 422 }
        );
      }

      order =
        updateOrderStatus(
          id,
          status,
          { userId: admin.id, name: admin.name },
          statusNote
        ) ?? order;

      // Fire notification hooks
      notifyOrderStatusChanged(order, status);
      if (status === 'confirmed') notifyOrderConfirmed(order);
      if (status === 'ready_for_pickup') notifyOrderReadyForPickup(order);
      if (status === 'cancelled') notifyOrderCancelled(order);
    }

    // Payment status change
    if (paymentStatus !== undefined) {
      order = updatePaymentStatus(id, paymentStatus) ?? order;
    }

    // Admin notes (internal only — never sent to customer)
    if (adminNotes !== undefined) {
      order = updateOrderAdminNotes(id, adminNotes) ?? order;
    }

    // Customer-visible notes
    if (customerNotes !== undefined) {
      order = updateOrderCustomerNotes(id, customerNotes) ?? order;
    }

    return NextResponse.json(order);
  } catch (err) {
    return handleAdminError(err);
  }
}
