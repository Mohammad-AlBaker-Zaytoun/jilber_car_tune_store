'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Search, ShoppingBag } from 'lucide-react';
import type { Order, OrderStatus } from '@/types/admin';
import { STATUS_COLORS, STATUSES, formatStatus } from '@/components/admin/orderStatus';

export default function OrdersClient() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');

  useEffect(() => {
    fetch('/api/admin/orders')
      .then((r) => r.json())
      .then((data: Order[]) => setOrders(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return orders
      .filter((o) => !statusFilter || o.status === statusFilter)
      .filter((o) =>
        !q ||
        o.ref.toLowerCase().includes(q) ||
        o.customer.fullName.toLowerCase().includes(q) ||
        o.customer.email.toLowerCase().includes(q)
      );
  }, [orders, search, statusFilter]);

  if (loading) return <div className="py-20 text-center text-xs text-zinc-600 animate-pulse">Loading…</div>;

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ref, name or email…"
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
            <option key={s} value={s}>{formatStatus(s)}</option>
          ))}
        </select>
        <span className="text-[10px] text-zinc-600 ml-auto">{filtered.length} order{filtered.length !== 1 ? 's' : ''}</span>
      </div>

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
                <th className="text-left px-5 py-3 text-[9px] text-zinc-600 tracking-[0.2em] uppercase font-bold">Ref</th>
                <th className="text-left px-4 py-3 text-[9px] text-zinc-600 tracking-[0.2em] uppercase font-bold">Customer</th>
                <th className="text-left px-4 py-3 text-[9px] text-zinc-600 tracking-[0.2em] uppercase font-bold hidden sm:table-cell">Vehicle</th>
                <th className="text-left px-4 py-3 text-[9px] text-zinc-600 tracking-[0.2em] uppercase font-bold hidden md:table-cell">Total</th>
                <th className="text-left px-4 py-3 text-[9px] text-zinc-600 tracking-[0.2em] uppercase font-bold">Status</th>
                <th className="text-right px-5 py-3 text-[9px] text-zinc-600 tracking-[0.2em] uppercase font-bold">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr key={order.id} className="border-b border-zinc-800/30 hover:bg-zinc-900/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <Link href={`/admin/orders/${order.id}`} className="text-xs font-black text-cyan-400 hover:text-cyan-300 transition-colors">
                      {order.ref}
                    </Link>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-xs text-zinc-300 font-semibold">{order.customer.fullName}</p>
                    <p className="text-[10px] text-zinc-600">{order.customer.email}</p>
                  </td>
                  <td className="px-4 py-3.5 hidden sm:table-cell">
                    <span className="text-xs text-zinc-500">{order.vehicle.make} {order.vehicle.model} {order.vehicle.year}</span>
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <span className="text-xs font-black text-zinc-200">${order.total.toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-[9px] font-black tracking-widest uppercase border px-2 py-0.5 ${STATUS_COLORS[order.status]}`}>
                      {formatStatus(order.status)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className="text-[10px] text-zinc-600">{new Date(order.createdAt).toLocaleDateString()}</span>
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
