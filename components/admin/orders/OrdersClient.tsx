'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Search, ShoppingBag, Clock, Wrench, CheckCircle2, XCircle, Package2, AlertCircle,
} from 'lucide-react';
import type { Order, OrderStatus, PaymentStatus } from '@/types/admin';
import { STATUSES, formatStatus, PAYMENT_STATUSES, formatPaymentStatus } from '@/components/admin/orderStatus';
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
          <div className="border border-zinc-800/50 bg-zinc-900/20 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800/50">
                  <th className="text-left px-5 py-3 text-[9px] text-zinc-600 tracking-[0.2em] uppercase font-bold">Order</th>
                  <th className="text-left px-4 py-3 text-[9px] text-zinc-600 tracking-[0.2em] uppercase font-bold">Customer</th>
                  <th className="text-left px-4 py-3 text-[9px] text-zinc-600 tracking-[0.2em] uppercase font-bold hidden sm:table-cell">Vehicle</th>
                  <th className="text-left px-4 py-3 text-[9px] text-zinc-600 tracking-[0.2em] uppercase font-bold hidden lg:table-cell">Items</th>
                  <th className="text-left px-4 py-3 text-[9px] text-zinc-600 tracking-[0.2em] uppercase font-bold hidden md:table-cell">Total</th>
                  <th className="text-left px-4 py-3 text-[9px] text-zinc-600 tracking-[0.2em] uppercase font-bold hidden md:table-cell">Payment</th>
                  <th className="text-left px-4 py-3 text-[9px] text-zinc-600 tracking-[0.2em] uppercase font-bold">Status</th>
                  <th className="text-right px-5 py-3 text-[9px] text-zinc-600 tracking-[0.2em] uppercase font-bold">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-zinc-800/30 hover:bg-zinc-900/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-xs font-black text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        {order.ref}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-xs text-zinc-300 font-semibold">{order.customer.fullName}</p>
                      <p className="text-[10px] text-zinc-600">{order.customer.email}</p>
                    </td>
                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      <span className="text-xs text-zinc-500">
                        {order.vehicle.make} {order.vehicle.model} {order.vehicle.year}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <span className="text-xs text-zinc-500">
                        {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <span className="text-xs font-black text-zinc-200">
                        {formatMoneyCompact(order.total)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <PaymentStatusBadge status={order.paymentStatus} />
                    </td>
                    <td className="px-4 py-3.5">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="text-[10px] text-zinc-600">
                        {new Date(order.createdAt).toLocaleDateString('en-US')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination page={page} totalPages={data?.totalPages ?? 1} onChange={goToPage} />
        </>
      )}
    </>
  );
}
