/**
 * DEV-ONLY order store — JSON file on disk.
 * Replace with a real database before production.
 */

import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import type { Order, OrderStatus, PaymentStatus, OrderStatusHistoryEntry } from '@/types/admin';

export type { Order, OrderStatus, PaymentStatus, OrderStatusHistoryEntry };

const DB_PATH = path.join(process.cwd(), '.dev-orders.json');

// ---------------------------------------------------------------------------
// Migration: normalize legacy JSON records to the current Order shape
// ---------------------------------------------------------------------------
function migrateOrder(raw: Record<string, unknown>): Order {
  // Handle legacy status 'in-progress' → 'in_progress'
  let status = raw.status as string;
  if (status === 'in-progress') status = 'in_progress';

  // Handle legacy 'notes' field → 'adminNotes'
  const adminNotes =
    (raw.adminNotes as string | undefined) ??
    (raw.notes as string | undefined);

  const now = (raw.createdAt as string) ?? new Date().toISOString();

  return {
    id: raw.id as string,
    ref: raw.ref as string,
    status: status as OrderStatus,
    paymentStatus: (raw.paymentStatus as PaymentStatus | undefined) ?? 'unpaid',
    createdAt: now,
    updatedAt: (raw.updatedAt as string | undefined) ?? now,
    completedAt: raw.completedAt as string | undefined,
    cancelledAt: raw.cancelledAt as string | undefined,
    userId: raw.userId as string | undefined,
    customer: raw.customer as Order['customer'],
    vehicle: raw.vehicle as Order['vehicle'],
    items: raw.items as Order['items'],
    payment: raw.payment as string,
    subtotal: raw.subtotal as number,
    tax: raw.tax as number,
    total: raw.total as number,
    currency: (raw.currency as string | undefined) ?? 'USD',
    adminNotes,
    customerNotes: raw.customerNotes as string | undefined,
    statusHistory: (raw.statusHistory as OrderStatusHistoryEntry[] | undefined) ?? [],
  };
}

function readStore(): Order[] {
  try {
    if (!fs.existsSync(DB_PATH)) return [];
    const raw = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8')) as Record<string, unknown>[];
    return raw.map(migrateOrder);
  } catch {
    return [];
  }
}

function writeStore(orders: Order[]): void {
  fs.writeFileSync(DB_PATH, JSON.stringify(orders, null, 2), 'utf-8');
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export function getOrders(): Order[] {
  return readStore().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getOrderById(id: string): Order | null {
  return readStore().find((o) => o.id === id) ?? null;
}

export function getOrderByRef(ref: string): Order | null {
  return readStore().find((o) => o.ref === ref) ?? null;
}

export function getOrdersByUserId(userId: string): Order[] {
  return readStore()
    .filter((o) => o.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function countOrders(): { total: number; pending: number } {
  const all = readStore();
  return {
    total: all.length,
    pending: all.filter((o) => o.status === 'pending').length,
  };
}

export function estimatedRevenue(): number {
  return readStore()
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0);
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

export function createOrder(
  data: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'statusHistory'> & {
    initialHistoryEntry?: Omit<OrderStatusHistoryEntry, 'id' | 'orderId'>;
  }
): Order {
  const orders = readStore();
  const id = randomUUID();
  const now = new Date().toISOString();

  const { initialHistoryEntry, ...rest } = data;

  const historyEntry: OrderStatusHistoryEntry = {
    id: randomUUID(),
    orderId: id,
    fromStatus: null,
    toStatus: 'pending',
    changedByUserId: initialHistoryEntry?.changedByUserId ?? 'system',
    changedByName: initialHistoryEntry?.changedByName ?? 'System',
    note: initialHistoryEntry?.note ?? 'Order placed',
    createdAt: now,
  };

  const order: Order = {
    ...rest,
    id,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
    statusHistory: [historyEntry],
  };

  writeStore([...orders, order]);
  return order;
}

export function updateOrderStatus(
  id: string,
  status: OrderStatus,
  actor: { userId: string; name: string },
  note?: string
): Order | null {
  const orders = readStore();
  const idx = orders.findIndex((o) => o.id === id);
  if (idx === -1) return null;

  const prev = orders[idx];
  const now = new Date().toISOString();

  const historyEntry: OrderStatusHistoryEntry = {
    id: randomUUID(),
    orderId: id,
    fromStatus: prev.status,
    toStatus: status,
    changedByUserId: actor.userId,
    changedByName: actor.name,
    note,
    createdAt: now,
  };

  orders[idx] = {
    ...prev,
    status,
    updatedAt: now,
    completedAt: status === 'completed' ? now : prev.completedAt,
    cancelledAt: status === 'cancelled' ? now : prev.cancelledAt,
    statusHistory: [...(prev.statusHistory ?? []), historyEntry],
  };

  writeStore(orders);
  return orders[idx];
}

export function updateOrderAdminNotes(id: string, adminNotes: string): Order | null {
  const orders = readStore();
  const idx = orders.findIndex((o) => o.id === id);
  if (idx === -1) return null;
  orders[idx] = { ...orders[idx], adminNotes, updatedAt: new Date().toISOString() };
  writeStore(orders);
  return orders[idx];
}

export function updateOrderCustomerNotes(id: string, customerNotes: string): Order | null {
  const orders = readStore();
  const idx = orders.findIndex((o) => o.id === id);
  if (idx === -1) return null;
  orders[idx] = { ...orders[idx], customerNotes, updatedAt: new Date().toISOString() };
  writeStore(orders);
  return orders[idx];
}

export function updatePaymentStatus(id: string, paymentStatus: PaymentStatus): Order | null {
  const orders = readStore();
  const idx = orders.findIndex((o) => o.id === id);
  if (idx === -1) return null;
  orders[idx] = { ...orders[idx], paymentStatus, updatedAt: new Date().toISOString() };
  writeStore(orders);
  return orders[idx];
}

// Legacy compat — kept so any existing call sites don't break during migration
export function updateOrderNotes(id: string, notes: string): Order | null {
  return updateOrderAdminNotes(id, notes);
}

// ---------------------------------------------------------------------------
// Customer-safe serialisation
// ---------------------------------------------------------------------------

/**
 * Strip adminNotes and anonymise admin identities in statusHistory before
 * sending an order to a customer API route or server component.
 *
 * The customer's own history entries (e.g. "Order placed" with their userId)
 * are left with their real name. All other actors are replaced with 'Workshop'
 * so that internal staff names and UUIDs are never exposed.
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
        entry.changedByUserId === sessionUserId
          ? entry.changedByName
          : 'Workshop',
    })),
  };
}
