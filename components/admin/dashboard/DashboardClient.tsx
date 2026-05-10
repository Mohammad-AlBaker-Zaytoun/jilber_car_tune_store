'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Package,
  ShoppingBag,
  Users,
  DollarSign,
  Clock,
  TrendingUp,
  Plus,
  ArrowRight,
} from 'lucide-react';
import AdminStatCard from '@/components/admin/AdminStatCard';
import type { AdminStats, Order } from '@/types/admin';

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/5',
  confirmed: 'text-cyan-400 border-cyan-400/30 bg-cyan-400/5',
  'in-progress': 'text-blue-400 border-blue-400/30 bg-blue-400/5',
  completed: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5',
  cancelled: 'text-red-400 border-red-400/30 bg-red-400/5',
};

export default function DashboardClient() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/stats').then((r) => r.json()) as Promise<AdminStats>,
      fetch('/api/admin/orders').then((r) => r.json()) as Promise<Order[]>,
    ])
      .then(([s, orders]) => {
        setStats(s);
        setRecentOrders(orders.slice(0, 6));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-xs text-zinc-600 tracking-widest uppercase animate-pulse">
          Loading…
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Stats grid */}
      {stats && (
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
          <AdminStatCard
            label="Total Products"
            value={stats.totalProducts}
            icon={Package}
            accent="cyan"
          />
          <AdminStatCard
            label="Active / In Stock"
            value={stats.activeProducts}
            icon={TrendingUp}
            accent="green"
          />
          <AdminStatCard
            label="Total Users"
            value={stats.totalUsers}
            icon={Users}
            accent="purple"
          />
          <AdminStatCard
            label="Total Orders"
            value={stats.totalOrders}
            icon={ShoppingBag}
            accent="cyan"
          />
          <AdminStatCard
            label="Pending Orders"
            value={stats.pendingOrders}
            icon={Clock}
            accent="yellow"
          />
          <AdminStatCard
            label="Est. Revenue"
            value={`$${stats.estimatedRevenue.toLocaleString()}`}
            icon={DollarSign}
            accent="green"
            sub="Excludes cancelled orders"
          />
        </div>
      )}

      {/* Quick actions */}
      <div className="border border-zinc-800/50 bg-zinc-900/20 p-6">
        <h2 className="text-[10px] font-black text-white tracking-[0.25em] uppercase mb-5">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-black text-xs font-black tracking-[0.2em] uppercase transition-all duration-200 hover:shadow-[0_0_20px_rgba(0,212,255,0.4)]"
          >
            <Plus size={12} aria-hidden="true" />
            Add Product
          </Link>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-zinc-700 hover:border-cyan-400/40 text-zinc-300 hover:text-cyan-400 text-xs font-black tracking-[0.2em] uppercase transition-all duration-200"
          >
            <ShoppingBag size={12} aria-hidden="true" />
            Manage Orders
          </Link>
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-zinc-700 hover:border-cyan-400/40 text-zinc-300 hover:text-cyan-400 text-xs font-black tracking-[0.2em] uppercase transition-all duration-200"
          >
            <Package size={12} aria-hidden="true" />
            Manage Products
          </Link>
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-zinc-700 hover:border-cyan-400/40 text-zinc-300 hover:text-cyan-400 text-xs font-black tracking-[0.2em] uppercase transition-all duration-200"
          >
            <Users size={12} aria-hidden="true" />
            Manage Users
          </Link>
        </div>
      </div>

      {/* Recent orders */}
      <div className="border border-zinc-800/50 bg-zinc-900/20">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/50">
          <h2 className="text-[10px] font-black text-white tracking-[0.25em] uppercase">
            Recent Orders
          </h2>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1.5 text-[10px] text-cyan-400 hover:text-cyan-300 font-bold tracking-widest uppercase transition-colors"
          >
            View All <ArrowRight size={9} aria-hidden="true" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="px-6 py-10 text-center text-xs text-zinc-600">
            No orders yet. Orders will appear here after customers check out.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800/50">
                  <th className="text-left px-6 py-3 text-[9px] text-zinc-600 tracking-[0.2em] uppercase font-bold">Ref</th>
                  <th className="text-left px-4 py-3 text-[9px] text-zinc-600 tracking-[0.2em] uppercase font-bold">Customer</th>
                  <th className="text-left px-4 py-3 text-[9px] text-zinc-600 tracking-[0.2em] uppercase font-bold hidden sm:table-cell">Total</th>
                  <th className="text-left px-4 py-3 text-[9px] text-zinc-600 tracking-[0.2em] uppercase font-bold">Status</th>
                  <th className="text-right px-6 py-3 text-[9px] text-zinc-600 tracking-[0.2em] uppercase font-bold hidden md:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-zinc-800/30 hover:bg-zinc-900/30 transition-colors group"
                  >
                    <td className="px-6 py-3.5">
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
                      <span className="text-xs text-zinc-300 font-semibold">
                        ${order.total.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-[9px] font-black tracking-widest uppercase border px-2 py-0.5 ${STATUS_COLORS[order.status] ?? 'text-zinc-400 border-zinc-700 bg-zinc-900/30'}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right hidden md:table-cell">
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
      </div>
    </div>
  );
}
