/**
 * Order repository — MSSQL via Prisma.
 *
 * Public function names/signatures unchanged from the old JSON store. Orders own
 * two child tables (items, statusHistory); creating an order and changing its
 * status are wrapped so the parent row and its history row are written together.
 * The customer/vehicle value objects are stored as flat columns and reassembled
 * here so the returned objects satisfy the `Order` type.
 */

import { randomUUID, randomBytes } from 'crypto';
import { prisma } from '@/lib/db/prisma';
import type {
  Order as OrderRow,
  OrderItem as OrderItemRow,
  OrderStatusHistory as HistoryRow,
} from '@prisma/client';
import type { Order, OrderStatus, PaymentStatus, OrderStatusHistoryEntry } from '@/types/admin';

export type { Order, OrderStatus, PaymentStatus, OrderStatusHistoryEntry };

type OrderRowFull = OrderRow & { items: OrderItemRow[]; statusHistory: HistoryRow[] };

const includeChildren = { items: true, statusHistory: { orderBy: { createdAt: 'asc' as const } } };

/** Generates a human-friendly order reference like `TUNE-20260615-AB3KP`. */
export function generateOrderRef(): string {
  const date = new Date();
  const yyyymmdd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const code = Array.from(randomBytes(5))
    .map((b) => chars[b % chars.length])
    .join('');
  return `TUNE-${yyyymmdd}-${code}`;
}

function rowToOrder(row: OrderRowFull): Order {
  return {
    id: row.id,
    ref: row.ref,
    status: row.status as OrderStatus,
    paymentStatus: row.paymentStatus as PaymentStatus,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    completedAt: row.completedAt?.toISOString(),
    cancelledAt: row.cancelledAt?.toISOString(),
    userId: row.userId ?? undefined,
    customer: {
      fullName: row.customerFullName,
      email: row.customerEmail,
      phone: row.customerPhone,
      address: row.customerAddress,
    },
    vehicle: {
      make: row.vehicleMake,
      model: row.vehicleModel,
      year: row.vehicleYear,
      engine: row.vehicleEngine,
      currentMods: row.vehicleCurrentMods,
      serviceDate: row.vehicleServiceDate,
    },
    items: row.items.map((i) => ({
      id: i.id,
      slug: i.slug,
      name: i.name,
      category: i.category,
      price: Number(i.price),
      currency: i.currency,
      quantity: i.quantity,
      visualColor: i.visualColor,
    })),
    payment: row.payment,
    subtotal: Number(row.subtotal),
    tax: Number(row.tax),
    total: Number(row.total),
    currency: row.currency,
    adminNotes: row.adminNotes ?? undefined,
    customerNotes: row.customerNotes ?? undefined,
    statusHistory: row.statusHistory.map((h) => ({
      id: h.id,
      orderId: h.orderId,
      fromStatus: (h.fromStatus as OrderStatus | null) ?? null,
      toStatus: h.toStatus as OrderStatus,
      changedByUserId: h.changedByUserId,
      changedByName: h.changedByName,
      note: h.note ?? undefined,
      createdAt: h.createdAt.toISOString(),
    })),
  };
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function getOrders(): Promise<Order[]> {
  const rows = await prisma.order.findMany({
    include: includeChildren,
    orderBy: { createdAt: 'desc' },
  });
  return rows.map(rowToOrder);
}

export async function getOrderById(id: string): Promise<Order | null> {
  const row = await prisma.order.findUnique({ where: { id }, include: includeChildren });
  return row ? rowToOrder(row) : null;
}

export async function getOrderByRef(ref: string): Promise<Order | null> {
  const row = await prisma.order.findUnique({ where: { ref }, include: includeChildren });
  return row ? rowToOrder(row) : null;
}

export async function getOrdersByUserId(userId: string): Promise<Order[]> {
  const rows = await prisma.order.findMany({
    where: { userId },
    include: includeChildren,
    orderBy: { createdAt: 'desc' },
  });
  return rows.map(rowToOrder);
}

export async function countOrders(): Promise<{ total: number; pending: number }> {
  const [total, pending] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: 'pending' } }),
  ]);
  return { total, pending };
}

export async function estimatedRevenue(): Promise<number> {
  const agg = await prisma.order.aggregate({
    where: { status: { not: 'cancelled' } },
    _sum: { total: true },
  });
  return Number(agg._sum.total ?? 0);
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

export async function createOrder(
  data: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'statusHistory'> & {
    initialHistoryEntry?: Omit<OrderStatusHistoryEntry, 'id' | 'orderId'>;
  }
): Promise<Order> {
  const id = randomUUID();
  const { initialHistoryEntry, customer, vehicle, items, ...rest } = data;

  const row = await prisma.order.create({
    data: {
      id,
      ref: rest.ref,
      status: 'pending',
      paymentStatus: rest.paymentStatus,
      userId: rest.userId,
      customerFullName: customer.fullName,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      customerAddress: customer.address,
      vehicleMake: vehicle.make,
      vehicleModel: vehicle.model,
      vehicleYear: vehicle.year,
      vehicleEngine: vehicle.engine,
      vehicleCurrentMods: vehicle.currentMods,
      vehicleServiceDate: vehicle.serviceDate,
      payment: rest.payment,
      subtotal: rest.subtotal,
      tax: rest.tax,
      total: rest.total,
      currency: rest.currency,
      adminNotes: rest.adminNotes,
      customerNotes: rest.customerNotes,
      completedAt: rest.completedAt ? new Date(rest.completedAt) : null,
      cancelledAt: rest.cancelledAt ? new Date(rest.cancelledAt) : null,
      items: {
        // Always generate a fresh row id — OrderItem.id is a primary key in a
        // shared table, so it must be unique across all orders (the incoming
        // i.id is the product id and would collide when a product is reordered).
        create: items.map((i) => ({
          id: randomUUID(),
          slug: i.slug,
          name: i.name,
          category: i.category,
          price: i.price,
          currency: i.currency,
          quantity: i.quantity,
          visualColor: i.visualColor,
        })),
      },
      statusHistory: {
        create: [
          {
            id: randomUUID(),
            fromStatus: null,
            toStatus: 'pending',
            changedByUserId: initialHistoryEntry?.changedByUserId ?? 'system',
            changedByName: initialHistoryEntry?.changedByName ?? 'System',
            note: initialHistoryEntry?.note ?? 'Order placed',
          },
        ],
      },
    },
    include: includeChildren,
  });
  return rowToOrder(row);
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  actor: { userId: string; name: string },
  note?: string
): Promise<Order | null> {
  const prev = await prisma.order.findUnique({ where: { id } });
  if (!prev) return null;

  const now = new Date();
  const row = await prisma.order.update({
    where: { id },
    data: {
      status,
      updatedAt: now,
      completedAt: status === 'completed' ? now : prev.completedAt,
      cancelledAt: status === 'cancelled' ? now : prev.cancelledAt,
      statusHistory: {
        create: {
          id: randomUUID(),
          fromStatus: prev.status,
          toStatus: status,
          changedByUserId: actor.userId,
          changedByName: actor.name,
          note,
        },
      },
    },
    include: includeChildren,
  });
  return rowToOrder(row);
}

export async function updateOrderAdminNotes(
  id: string,
  adminNotes: string
): Promise<Order | null> {
  try {
    const row = await prisma.order.update({
      where: { id },
      data: { adminNotes, updatedAt: new Date() },
      include: includeChildren,
    });
    return rowToOrder(row);
  } catch {
    return null;
  }
}

export async function updateOrderCustomerNotes(
  id: string,
  customerNotes: string
): Promise<Order | null> {
  try {
    const row = await prisma.order.update({
      where: { id },
      data: { customerNotes, updatedAt: new Date() },
      include: includeChildren,
    });
    return rowToOrder(row);
  } catch {
    return null;
  }
}

export async function updatePaymentStatus(
  id: string,
  paymentStatus: PaymentStatus
): Promise<Order | null> {
  try {
    const row = await prisma.order.update({
      where: { id },
      data: { paymentStatus, updatedAt: new Date() },
      include: includeChildren,
    });
    return rowToOrder(row);
  } catch {
    return null;
  }
}

// Legacy compat — kept so any existing call sites don't break during migration
export async function updateOrderNotes(id: string, notes: string): Promise<Order | null> {
  return updateOrderAdminNotes(id, notes);
}

// ---------------------------------------------------------------------------
// Customer-safe serialisation
// ---------------------------------------------------------------------------

/**
 * Strip adminNotes and anonymise admin identities in statusHistory before
 * sending an order to a customer API route or server component.
 */
export function sanitizeOrderForCustomer(
  order: Order,
  sessionUserId: string
): Omit<Order, 'adminNotes'> {
  const { adminNotes: _adminNotes, ...base } = order;
  return {
    ...base,
    statusHistory: base.statusHistory.map((entry) => ({
      ...entry,
      changedByUserId: '',
      changedByName:
        entry.changedByUserId === sessionUserId ? entry.changedByName : 'Workshop',
    })),
  };
}
