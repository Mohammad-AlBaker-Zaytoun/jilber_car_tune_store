'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Search, Package, Store } from 'lucide-react';
import type { Order, OrderStatus } from '@/types/admin';
import { STATUSES, formatStatus } from '@/components/admin/orderStatus';
import OrderStatusBadge from '@/components/orders/OrderStatusBadge';
import PaymentStatusBadge from '@/components/orders/PaymentStatusBadge';

export default function AccountOrdersClient() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');

  useEffect(() => {
    fetch('/api/account/orders')
      .then((r) => r.json())
      .then((data: Order[]) => setOrders(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return orders
      .filter((o) => !statusFilter || o.status === statusFilter)
      .filter(
        (o) =>
          !q ||
          o.ref.toLowerCase().includes(q) ||
          `${o.vehicle.make} ${o.vehicle.model}`.toLowerCase().includes(q)
      );
  }, [orders, search, statusFilter]);

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-zinc-600 animate-pulse">
        Loading your orders…
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="border border-zinc-800/50 bg-zinc-900/20 flex flex-col items-center text-center py-20 px-8">
        <div className="w-16 h-16 flex items-center justify-center border border-zinc-800 bg-zinc-900/40 mb-6">
          <Package size={24} className="text-zinc-600" aria-hidden="true" />
        </div>
        <h3 className="text-lg font-black text-white mb-2">No orders yet</h3>
        <p className="text-sm text-zinc-500 max-w-xs leading-relaxed mb-8">
          When you complete a checkout, your orders will appear here. Explore our store to find
          your next performance upgrade.
        </p>
        <Link
          href="/store"
          className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-400 hover:bg-cyan-300 text-black font-black text-xs tracking-[0.2em] uppercase transition-all duration-200 hover:shadow-[0_0_24px_rgba(0,212,255,0.5)]"
        >
          <Store size={13} aria-hidden="true" />
          Browse Store
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-44">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ref or vehicle…"
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
        <span className="text-[10px] text-zinc-600 ml-auto">
          {filtered.length} order{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="border border-zinc-800/50 bg-zinc-900/20 flex flex-col items-center py-12 gap-3">
          <Package size={24} className="text-zinc-700" aria-hidden="true" />
          <p className="text-xs text-zinc-600">No orders match your filters.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((order) => (
            <Link
              key={order.id}
              href={`/account/orders/${order.id}`}
              className="border border-zinc-800/50 bg-zinc-900/20 hover:border-zinc-700 hover:bg-zinc-900/40 p-5 transition-all duration-200 group block"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                <div>
                  <p className="text-sm font-black text-cyan-400 group-hover:text-cyan-300 transition-colors tracking-wider">
                    {order.ref}
                  </p>
                  <p className="text-[10px] text-zinc-600 mt-0.5">
                    {new Date(order.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <PaymentStatusBadge status={order.paymentStatus} />
                  <OrderStatusBadge status={order.status} />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[10px]">
                <div>
                  <span className="text-zinc-600 uppercase tracking-wider font-bold">Vehicle</span>
                  <p className="text-zinc-400 mt-0.5">
                    {order.vehicle.make} {order.vehicle.model} {order.vehicle.year}
                  </p>
                </div>
                <div>
                  <span className="text-zinc-600 uppercase tracking-wider font-bold">Items</span>
                  <p className="text-zinc-400 mt-0.5">
                    {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div>
                  <span className="text-zinc-600 uppercase tracking-wider font-bold">Total</span>
                  <p className="text-zinc-200 font-black mt-0.5">${order.total.toLocaleString()}</p>
                </div>
              </div>

              {order.customerNotes && (
                <p className="mt-3 pt-3 border-t border-zinc-800/50 text-xs text-zinc-400 leading-relaxed">
                  {order.customerNotes}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
