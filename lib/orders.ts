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
  Prisma,
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
    whishExternalId: row.whishExternalId == null ? undefined : Number(row.whishExternalId),
    whishTransactionId: row.whishTransactionId ?? undefined,
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

export interface OrderPage {
  orders: Order[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  /**
   * Counts per status across the WHOLE table, not just this page — the admin
   * stat tiles must not change meaning when you turn the page.
   */
  statusCounts: Record<string, number>;
}

export interface OrderQuery {
  page?: number;
  pageSize?: number;
  status?: string;
  paymentStatus?: string;
  /** Matches order ref, customer name, or customer email. */
  search?: string;
}

export const ORDERS_PAGE_SIZE = 25;
const ORDERS_MAX_PAGE_SIZE = 100;

/**
 * Paginated, filtered order list for the admin table.
 *
 * `getOrders()` loads every order with every line item AND every status-history
 * row, serialises the lot into one JSON response, and lets the browser filter.
 * That is fine at demo scale and degrades linearly — it will time out the admin
 * dashboard as order history accumulates. Filtering moved to SQL so the indexes
 * on (userId, status, createdAt) actually get used.
 */
export async function getOrdersPage(query: OrderQuery = {}): Promise<OrderPage> {
  const page = Math.max(1, Math.floor(query.page ?? 1));
  const pageSize = Math.min(
    Math.max(1, Math.floor(query.pageSize ?? ORDERS_PAGE_SIZE)),
    ORDERS_MAX_PAGE_SIZE
  );

  const search = query.search?.trim();
  const where: Prisma.OrderWhereInput = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.paymentStatus ? { paymentStatus: query.paymentStatus } : {}),
    ...(search
      ? {
          OR: [
            { ref: { contains: search } },
            { customerFullName: { contains: search } },
            { customerEmail: { contains: search } },
          ],
        }
      : {}),
  };

  const [total, rows, grouped] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      include: includeChildren,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    // Unfiltered by status on purpose: the tiles are the navigation *between*
    // statuses, so they must show the totals you would get by clicking them.
    prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
  ]);

  const statusCounts: Record<string, number> = {};
  let allOrders = 0;
  for (const group of grouped) {
    statusCounts[group.status] = group._count._all;
    allOrders += group._count._all;
  }
  statusCounts.all = allOrders;

  return {
    orders: rows.map(rowToOrder),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    statusCounts,
  };
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
    where: {
      status: { not: 'cancelled' },
      // Exclude card orders that were initiated but never paid (abandoned online
      // payments) — they'd otherwise inflate the estimate. Shop/bank orders stay
      // in the pipeline estimate, and paid card orders count normally.
      NOT: { payment: 'card', paymentStatus: { not: 'paid' } },
    },
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
    /**
     * Pre-generated order id. Used by quote conversion, which must atomically
     * claim the quote against a known order id BEFORE creating the order —
     * otherwise two concurrent clicks each create one.
     */
    id?: string;
  }
): Promise<Order> {
  const { id: providedId, initialHistoryEntry, customer, vehicle, items, ...rest } = data;
  const id = providedId ?? randomUUID();

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

  // Conditional on the status we read. Two admins acting on the same order used
  // to both pass canTransition() against the same `from` state and both apply
  // their transition, producing a bogus history (e.g. two separate moves out of
  // "pending"). Scoping the update to `status: prev.status` means the second
  // writer matches zero rows and is told to retry.
  const { count } = await prisma.order.updateMany({
    where: { id, status: prev.status },
    data: {
      status,
      updatedAt: now,
      completedAt: status === 'completed' ? now : prev.completedAt,
      cancelledAt: status === 'cancelled' ? now : prev.cancelledAt,
    },
  });
  if (count === 0) return null;

  await prisma.orderStatusHistory.create({
    data: {
      id: randomUUID(),
      orderId: id,
      fromStatus: prev.status,
      toStatus: status,
      changedByUserId: actor.userId,
      changedByName: actor.name,
      note,
    },
  });

  const row = await prisma.order.findUnique({ where: { id }, include: includeChildren });
  return row ? rowToOrder(row) : null;
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
// Whish payment correlation
// ---------------------------------------------------------------------------

/** Persists the Whish externalId on an order before redirecting to payment. */
export async function attachWhishExternalId(
  orderId: string,
  externalId: number
): Promise<void> {
  await prisma.order.update({
    where: { id: orderId },
    data: { whishExternalId: BigInt(externalId) },
  });
}

/**
 * Detaches a Whish externalId from an order.
 *
 * Used when createPayment fails: the id was reserved before the call (so a
 * successful charge can always be correlated back), but if Whish never accepted
 * it, no payment can ever arrive against it. Leaving it attached makes the order
 * permanently visible to getUnconfirmedWhishOrders(), so the reconciliation cron
 * retries it forever and exits non-zero on every run.
 */
export async function clearWhishExternalId(orderId: string): Promise<void> {
  await prisma.order.updateMany({
    where: { id: orderId, paymentStatus: { in: SETTLEABLE_PAYMENT_STATUSES } },
    data: { whishExternalId: null, updatedAt: new Date() },
  });
}

/**
 * Records that online payment could not be started for an order, and returns the
 * refreshed order.
 *
 * The order row is written BEFORE the gateway is called, so a gateway failure
 * used to leave a real order that nobody was told about and that nothing ever
 * revisited: no customer email, no admin alert, and — because
 * clearWhishExternalId() correctly removes it from the reconciliation queue — no
 * cron either. An admin could not distinguish it from a customer who simply
 * abandoned the Whish page, since both render as an identical "Unpaid" badge.
 *
 * This writes the distinguishing evidence: an admin note plus a status-history
 * entry, which the order timeline already renders. `payment` stays 'card' and
 * `paymentStatus` stays 'unpaid' on purpose — rewriting the method to 'shop'
 * would make an unpaid order count toward estimatedRevenue(), which excludes
 * only unpaid *card* orders.
 */
export async function markOnlinePaymentUnavailable(
  orderId: string,
  reason: string
): Promise<Order | null> {
  const existing = await prisma.order.findUnique({
    where: { id: orderId },
    select: { adminNotes: true },
  });
  if (!existing) return null;

  const note = `[${new Date().toISOString()}] Online payment unavailable: ${reason}. Payment must be arranged manually or via the customer's pay link.`;

  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: {
        adminNotes: existing.adminNotes ? `${existing.adminNotes}\n${note}` : note,
        updatedAt: new Date(),
      },
    }),
    prisma.orderStatusHistory.create({
      data: {
        id: randomUUID(),
        orderId,
        // Not a status transition — the order stays 'pending'. This entry exists
        // to make the payment failure visible in the timeline.
        fromStatus: 'pending',
        toStatus: 'pending',
        changedByUserId: 'system',
        changedByName: 'System',
        note: `Online card payment could not be started (${reason}).`,
      },
    }),
  ]);

  const row = await prisma.order.findUnique({ where: { id: orderId }, include: includeChildren });
  return row ? rowToOrder(row) : null;
}

/** Looks up the order a Whish callback refers to by its externalId. */
export async function getOrderByWhishExternalId(externalId: number): Promise<Order | null> {
  const row = await prisma.order.findUnique({
    where: { whishExternalId: BigInt(externalId) },
    include: includeChildren,
  });
  return row ? rowToOrder(row) : null;
}

/**
 * The only payment states a Whish settlement may transition OUT of.
 *
 * Deliberately an allow-list, not `{ not: 'paid' }`. That negation also matched
 * `refunded`, `deposit_paid` and `not_required`, so a refunded order still had a
 * `whishExternalId` and still looked "unsettled": the reconciliation cron picked
 * it up, Whish still reported the original collection as successful (a refund is
 * a separate transaction), and the order was flipped back to `paid` — erasing the
 * refund from the books, re-inflating estimatedRevenue(), and emailing the
 * customer a second "order received".
 */
const SETTLEABLE_PAYMENT_STATUSES = ['unpaid', 'deposit_pending'];

/**
 * Whether a payment status may still be settled by an online payment.
 *
 * Exported so the resume-payment route enforces exactly the same rule as
 * markOnlinePaymentUnavailable/markOrderPaidByWhish rather than duplicating the
 * list — a divergence here would mean charging a refunded order.
 */
export function isSettleablePaymentStatus(status: string): boolean {
  return SETTLEABLE_PAYMENT_STATUSES.includes(status);
}

/**
 * Marks an order paid via Whish and records the transaction id.
 *
 * Idempotent and one-way. Returns 'paid_now' only on a genuine transition (so
 * callers notify exactly once), 'already_paid' on replay, 'not_settleable' when
 * the order has reached a terminal state a payment must not overwrite
 * (refunded/paid-by-other-means), and 'missing' if the order is gone.
 */
export async function markOrderPaidByWhish(
  orderId: string,
  transactionId?: string
): Promise<'paid_now' | 'already_paid' | 'not_settleable' | 'missing'> {
  // Conditional update, NOT read-then-write. Whish delivers both a server-to-
  // server callback and a browser redirect to this same endpoint, so two
  // requests routinely race here. A read-check-write let both observe 'unpaid'
  // and both return 'paid_now', sending the customer two confirmation emails and
  // the admin two alerts. Scoping the update makes the transition atomic in the
  // database — exactly one caller can see count === 1.
  // (Same pattern as the single-use token consumption in lib/password-reset.ts.)
  const { count } = await prisma.order.updateMany({
    where: { id: orderId, paymentStatus: { in: SETTLEABLE_PAYMENT_STATUSES } },
    data: {
      paymentStatus: 'paid',
      ...(transactionId ? { whishTransactionId: transactionId } : {}),
      updatedAt: new Date(),
    },
  });

  if (count === 1) return 'paid_now';

  // Nothing updated — distinguish "already settled" from "must not settle".
  const existing = await prisma.order.findUnique({
    where: { id: orderId },
    select: { paymentStatus: true },
  });
  if (!existing) return 'missing';
  return existing.paymentStatus === 'paid' ? 'already_paid' : 'not_settleable';
}

/**
 * Orders that were sent to Whish but never confirmed paid.
 *
 * The success callback is the ONLY path that marks a card order paid. If Whish's
 * request is dropped, times out, or the status query throws, the customer has
 * paid and the order sits `unpaid` forever with no confirmation email and no
 * alert. This backs the reconciliation job (scripts/reconcile-payments.ts) that
 * re-queries Whish for these and settles them.
 *
 * `olderThanMs` skips in-flight checkouts where the customer is still on the
 * Whish payment page.
 */
export async function getUnconfirmedWhishOrders(olderThanMs = 10 * 60_000): Promise<Order[]> {
  const rows = await prisma.order.findMany({
    where: {
      whishExternalId: { not: null },
      // Same allow-list as markOrderPaidByWhish: a refunded order must not be
      // re-examined by the reconciler at all, or the cron re-settles it every
      // 15 minutes.
      paymentStatus: { in: SETTLEABLE_PAYMENT_STATUSES },
      status: { not: 'cancelled' },
      createdAt: { lt: new Date(Date.now() - olderThanMs) },
    },
    include: includeChildren,
    orderBy: { createdAt: 'asc' },
  });
  return rows.map(rowToOrder);
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
