'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Search, ShoppingBag, Clock, Wrench, CheckCircle2, XCircle, Package2, AlertCircle,
} from 'lucide-react';
import type { Order, OrderStatus, PaymentStatus } from '@/types/admin';
import { STATUSES, formatStatus, PAYMENT_STATUSES, formatPaymentStatus, formatPaymentMethod } from '@/components/admin/orderStatus';
import OrderStatusBadge from '@/components/orders/OrderStatusBadge';
import PaymentStatusBadge from '@/components/orders/PaymentStatusBadge';
import { formatMoneyCompact } from '@/lib/currency';
import Pagination from '@/components/admin/Pagination';
import { usePagedResource } from '@/hooks/usePagedResource';

interface OrderPageResponse {
  orders: Order[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  statusCounts: Record<string, number>;
}

const TILES: { label: string; status: OrderStatus | ''; icon: typeof Package2; color: string }[] = [
  { label: 'Total', status: '', icon: Package2, color: 'text-zinc-400' },
  { label: 'Pending', status: 'pending', icon: Clock, color: 'text-amber-400' },
  { label: 'In Progress', status: 'in_progress', icon: Wrench, color: 'text-blue-400' },
  { label: 'Ready', status: 'ready_for_pickup', icon: CheckCircle2, color: 'text-teal-400' },
  { label: 'Completed', status: 'completed', icon: CheckCircle2, color: 'text-emerald-400' },
  { label: 'Cancelled', status: 'cancelled', icon: XCircle, color: 'text-red-400' },
];

/**
 * The columns, in order. Drives the table header AND the card labels, so the two
 * layouts cannot drift apart.
 *
 * The order reference is not a column here: it is the row's heading in the card
 * layout and its first cell in the table, so it is rendered separately.
 */
const ORDER_COLUMNS = [
  'Customer',
  'Vehicle',
  'Items',
  'Total',
  'Method',
  'Payment',
  'Status',
  'Date',
] as const;

type OrderColumn = (typeof ORDER_COLUMNS)[number];

/**
 * A row's cells, defined once for both layouts.
 *
 * Typed as a complete Record, so adding a column to ORDER_COLUMNS without
 * supplying its cell is a type error rather than a blank space on one breakpoint.
 * This is the guard the old markup lacked: five columns were `hidden md:table-cell`
 * with no mobile equivalent, which left an order's Total and Payment status
 * unreachable on a phone.
 */
function orderCells(order: Order): Record<OrderColumn, React.ReactNode> {
  return {
    Customer: (
      <>
        <p className="text-xs text-zinc-300 font-semibold wrap-anywhere">
          {order.customer.fullName}
        </p>
        <p className="text-[10px] text-zinc-600 wrap-anywhere">{order.customer.email}</p>
      </>
    ),
    Vehicle: (
      <span className="text-xs text-zinc-500">
        {order.vehicle.make} {order.vehicle.model} {order.vehicle.year}
      </span>
    ),
    Items: (
      <span className="text-xs text-zinc-500">
        {order.items.length} item{order.items.length !== 1 ? 's' : ''}
      </span>
    ),
    Total: (
      <span className="text-xs font-black text-zinc-200">{formatMoneyCompact(order.total)}</span>
    ),
    Method: (
      <span className="text-[10px] text-zinc-500 uppercase tracking-wide">
        {formatPaymentMethod(order.payment)}
      </span>
    ),
    Payment: <PaymentStatusBadge status={order.paymentStatus} />,
    Status: <OrderStatusBadge status={order.status} />,
    Date: (
      <span className="text-[10px] text-zinc-600">
        {new Date(order.createdAt).toLocaleDateString('en-US')}
      </span>
    ),
  };
}

const thCls =
  'text-left px-4 py-3 text-[9px] text-zinc-600 tracking-[0.2em] uppercase font-bold whitespace-nowrap';

export default function OrdersClient() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | ''>('');

  // Uses the shared hook rather than a private copy. The copy that used to live
  // here had the same defect: `page` was a raw effect dependency while filters
  // were debounced, so changing a filter on page 3 fired a request with the old
  // filters before the corrected one.
  const { data, loading, error, page, applyFilters, reload, goToPage } =
    usePagedResource<OrderPageResponse>({
      endpoint: '/api/admin/orders',
      filters: { search, status: statusFilter, paymentStatus: paymentFilter },
    });

  const orders = data?.orders ?? [];
  const counts = data?.statusCounts ?? {};

  if (loading && !data) {
    return <div className="py-20 text-center text-xs text-zinc-600 animate-pulse">Loading…</div>;
  }

  return (
    <>
      {/* Stats row — counts come from the server so they describe the whole
          table, not just the page currently on screen. */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {TILES.map(({ label, status, icon: Icon, color }) => (
          <button
            key={label}
            onClick={() => applyFilters(() => setStatusFilter(status))}
            className={`border border-zinc-800/50 bg-zinc-900/20 p-4 text-left hover:border-zinc-700 transition-colors ${
              statusFilter === status ? 'border-zinc-600' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] text-zinc-600 tracking-[0.2em] uppercase font-bold">{label}</p>
              <Icon size={12} className={color} aria-hidden="true" />
            </div>
            <p className={`text-xl font-black ${color}`}>
              {counts[status === '' ? 'all' : status] ?? 0}
            </p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => applyFilters(() => setSearch(e.target.value))}
            placeholder="Search ref, name, or email…"
            className="w-full bg-zinc-900 border border-zinc-800 focus:border-cyan-400/50 text-zinc-100 text-xs pl-9 pr-4 py-2.5 outline-none transition-colors placeholder:text-zinc-600"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => applyFilters(() => setStatusFilter(e.target.value as OrderStatus | ''))}
          className="bg-zinc-900 border border-zinc-800 focus:border-cyan-400/50 text-zinc-400 text-xs px-3 py-2.5 outline-none transition-colors"
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{formatStatus(s)}</option>
          ))}
        </select>

        <select
          value={paymentFilter}
          onChange={(e) => applyFilters(() => setPaymentFilter(e.target.value as PaymentStatus | ''))}
          className="bg-zinc-900 border border-zinc-800 focus:border-cyan-400/50 text-zinc-400 text-xs px-3 py-2.5 outline-none transition-colors"
        >
          <option value="">All Payments</option>
          {PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>{formatPaymentStatus(s)}</option>
          ))}
        </select>

        <span className="text-[10px] text-zinc-600 ml-auto">
          {data?.total ?? 0} order{(data?.total ?? 0) !== 1 ? 's' : ''}
          {loading && ' · updating…'}
        </span>
      </div>

      {error ? (
        <div className="border border-red-500/30 bg-red-500/5 flex flex-col items-center py-16 gap-4">
          <AlertCircle size={32} className="text-red-400" aria-hidden="true" />
          <p className="text-xs text-red-400">{error}</p>
          <button
            onClick={reload}
            className="px-4 py-2 border border-zinc-700 hover:border-cyan-400/40 text-zinc-300 hover:text-cyan-400 text-[10px] font-black tracking-[0.2em] uppercase transition-colors"
          >
            Retry
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="border border-zinc-800/50 bg-zinc-900/20 flex flex-col items-center py-16 gap-4">
          <ShoppingBag size={32} className="text-zinc-700" aria-hidden="true" />
          <p className="text-xs text-zinc-600">
            {(counts.all ?? 0) === 0
              ? 'No orders yet. Orders appear here after customers check out.'
              : 'No orders match your filters.'}
          </p>
        </div>
      ) : (
        <>
          {/* Wide screens: a real table, which is what tabular data should be —
              screen readers get row and column navigation. */}
          <div className="hidden lg:block border border-zinc-800/50 bg-zinc-900/20 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800/50">
                  <th className={thCls}>Order</th>
                  {ORDER_COLUMNS.map((col) => (
                    <th key={col} className={thCls}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const cells = orderCells(order);
                  return (
                    <tr
                      key={order.id}
                      className="border-b border-zinc-800/30 hover:bg-zinc-900/30 transition-colors"
                    >
                      <td className="px-4 py-3.5 align-top">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="text-xs font-black text-cyan-400 hover:text-cyan-300 transition-colors"
                        >
                          {order.ref}
                        </Link>
                      </td>
                      {ORDER_COLUMNS.map((col) => (
                        <td key={col} className="px-4 py-3.5 align-top">
                          {cells[col]}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Phones and tablets: one card per order, every field labelled. A
              sideways-scrolling nine-column table is not usable with a thumb, and
              hiding the columns made Total and Payment unreachable. */}
          <ul aria-label="Orders" className="lg:hidden flex flex-col gap-3">
            {orders.map((order) => {
              const cells = orderCells(order);
              return (
                <li
                  key={order.id}
                  className="border border-zinc-800/50 bg-zinc-900/20 p-4 flex flex-col gap-3"
                >
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="text-xs font-black text-cyan-400 hover:text-cyan-300 transition-colors wrap-anywhere"
                  >
                    {order.ref}
                  </Link>
                  {/* grid-cols-[auto_1fr] keeps the labels in a column so the
                      values line up; min-w-0 on the value lets a long email wrap
                      instead of forcing the track wider. */}
                  <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 items-baseline">
                    {ORDER_COLUMNS.map((col) => (
                      <div key={col} className="contents">
                        <dt className="text-[9px] text-zinc-600 tracking-[0.15em] uppercase font-bold">
                          {col}
                        </dt>
                        <dd className="min-w-0">{cells[col]}</dd>
                      </div>
                    ))}
                  </dl>
                </li>
              );
            })}
          </ul>

          <Pagination page={page} totalPages={data?.totalPages ?? 1} onChange={goToPage} />
        </>
      )}
    </>
  );
}
