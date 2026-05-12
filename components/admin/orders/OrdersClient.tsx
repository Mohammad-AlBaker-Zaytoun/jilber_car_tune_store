'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Search, ShoppingBag, Clock, Wrench, CheckCircle2, XCircle, Package2 } from 'lucide-react';
import type { Order, OrderStatus, PaymentStatus } from '@/types/admin';
import { STATUSES, formatStatus, PAYMENT_STATUSES, formatPaymentStatus } from '@/components/admin/orderStatus';
import OrderStatusBadge from '@/components/orders/OrderStatusBadge';
import PaymentStatusBadge from '@/components/orders/PaymentStatusBadge';

export default function OrdersClient() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | ''>('');

  useEffect(() => {
    fetch('/api/admin/orders')
      .then((r) => r.json())
      .then((data: Order[]) => setOrders(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => ({
    total: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    inProgress: orders.filter((o) => o.status === 'in_progress').length,
    readyForPickup: orders.filter((o) => o.status === 'ready_for_pickup').length,
    completed: orders.filter((o) => o.status === 'completed').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
  }), [orders]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return orders
      .filter((o) => !statusFilter || o.status === statusFilter)
      .filter((o) => !paymentFilter || o.paymentStatus === paymentFilter)
      .filter((o) =>
        !q ||
        o.ref.toLowerCase().includes(q) ||
        o.customer.fullName.toLowerCase().includes(q) ||
        o.customer.email.toLowerCase().includes(q) ||
        o.customer.phone.toLowerCase().includes(q) ||
        `${o.vehicle.make} ${o.vehicle.model}`.toLowerCase().includes(q)
      );
  }, [orders, search, statusFilter, paymentFilter]);

  if (loading) {
    return <div className="py-20 text-center text-xs text-zinc-600 animate-pulse">Loading…</div>;
  }

  return (
    <>
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {[
          { label: 'Total', value: stats.total, icon: Package2, color: 'text-zinc-400' },
          { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-400' },
          { label: 'In Progress', value: stats.inProgress, icon: Wrench, color: 'text-blue-400' },
          { label: 'Ready', value: stats.readyForPickup, icon: CheckCircle2, color: 'text-teal-400' },
          { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'text-emerald-400' },
          { label: 'Cancelled', value: stats.cancelled, icon: XCircle, color: 'text-red-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <button
            key={label}
            onClick={() => {
              const map: Record<string, OrderStatus | ''> = {
                Total: '',
                Pending: 'pending',
                'In Progress': 'in_progress',
                Ready: 'ready_for_pickup',
                Completed: 'completed',
                Cancelled: 'cancelled',
              };
              setStatusFilter(map[label] ?? '');
            }}
            className={`border border-zinc-800/50 bg-zinc-900/20 p-4 text-left hover:border-zinc-700 transition-colors group ${
              (label === 'Total' && statusFilter === '') ||
              (label === 'Pending' && statusFilter === 'pending') ||
              (label === 'In Progress' && statusFilter === 'in_progress') ||
              (label === 'Ready' && statusFilter === 'ready_for_pickup') ||
              (label === 'Completed' && statusFilter === 'completed') ||
              (label === 'Cancelled' && statusFilter === 'cancelled')
                ? 'border-zinc-600'
                : ''
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] text-zinc-600 tracking-[0.2em] uppercase font-bold">{label}</p>
              <Icon size={12} className={color} aria-hidden="true" />
            </div>
            <p className={`text-xl font-black ${color}`}>{value}</p>
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
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ref, name, email, phone, vehicle…"
            className="w-full bg-zinc-900 border border-zinc-800 focus:border-cyan-400/50 text-zinc-100 text-xs pl-9 pr-4 py-2.5 outline-none transition-colors placeholder:text-zinc-600"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as OrderStatus | '')}
          className="bg-zinc-900 border border-zinc-800 focus:border-cyan-400/50 text-zinc-400 text-xs px-3 py-2.5 outline-none transition-colors"
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {formatStatus(s)}
            </option>
          ))}
        </select>

        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value as PaymentStatus | '')}
          className="bg-zinc-900 border border-zinc-800 focus:border-cyan-400/50 text-zinc-400 text-xs px-3 py-2.5 outline-none transition-colors"
        >
          <option value="">All Payments</option>
          {PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {formatPaymentStatus(s)}
            </option>
          ))}
        </select>

        <span className="text-[10px] text-zinc-600 ml-auto">
          {filtered.length} order{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="border border-zinc-800/50 bg-zinc-900/20 flex flex-col items-center py-16 gap-4">
          <ShoppingBag size={32} className="text-zinc-700" aria-hidden="true" />
          <p className="text-xs text-zinc-600">
            {orders.length === 0
              ? 'No orders yet. Orders appear here after customers check out.'
              : 'No orders match your filters.'}
          </p>
        </div>
      ) : (
        <div className="border border-zinc-800/50 bg-zinc-900/20 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800/50">
                <th className="text-left px-5 py-3 text-[9px] text-zinc-600 tracking-[0.2em] uppercase font-bold">
                  Order
                </th>
                <th className="text-left px-4 py-3 text-[9px] text-zinc-600 tracking-[0.2em] uppercase font-bold">
                  Customer
                </th>
                <th className="text-left px-4 py-3 text-[9px] text-zinc-600 tracking-[0.2em] uppercase font-bold hidden sm:table-cell">
                  Vehicle
                </th>
                <th className="text-left px-4 py-3 text-[9px] text-zinc-600 tracking-[0.2em] uppercase font-bold hidden lg:table-cell">
                  Items
                </th>
                <th className="text-left px-4 py-3 text-[9px] text-zinc-600 tracking-[0.2em] uppercase font-bold hidden md:table-cell">
                  Total
                </th>
                <th className="text-left px-4 py-3 text-[9px] text-zinc-600 tracking-[0.2em] uppercase font-bold hidden md:table-cell">
                  Payment
                </th>
                <th className="text-left px-4 py-3 text-[9px] text-zinc-600 tracking-[0.2em] uppercase font-bold">
                  Status
                </th>
                <th className="text-right px-5 py-3 text-[9px] text-zinc-600 tracking-[0.2em] uppercase font-bold">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-zinc-800/30 hover:bg-zinc-900/30 transition-colors"
                >
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
                      ${order.total.toLocaleString()}
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
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
