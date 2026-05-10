'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import type { Order, OrderStatus } from '@/types/admin';

const STATUSES: OrderStatus[] = ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'];

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/5',
  confirmed: 'text-cyan-400 border-cyan-400/30 bg-cyan-400/5',
  'in-progress': 'text-blue-400 border-blue-400/30 bg-blue-400/5',
  completed: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5',
  cancelled: 'text-red-400 border-red-400/30 bg-red-400/5',
};

interface Props {
  order: Order;
}

const sectionCls = 'border border-zinc-800/50 bg-zinc-900/20 p-6';
const labelCls = 'text-[9px] text-zinc-600 tracking-[0.2em] uppercase font-bold mb-1';
const valueCls = 'text-xs text-zinc-300';

export default function OrderDetailClient({ order: initialOrder }: Props) {
  const [order, setOrder] = useState(initialOrder);
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [notes, setNotes] = useState(order.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes }),
      });
      const updated = (await res.json()) as Order;
      setOrder(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1.5 text-[10px] text-zinc-600 hover:text-cyan-400 font-bold tracking-widest uppercase transition-colors"
        >
          <ArrowLeft size={10} aria-hidden="true" /> Back
        </Link>
        <span className={`text-[9px] font-black tracking-widest uppercase border px-2 py-0.5 ${STATUS_COLORS[order.status] ?? ''}`}>
          {order.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer info */}
        <div className={sectionCls}>
          <h3 className="text-[10px] font-black text-white tracking-[0.25em] uppercase mb-5">Customer</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              ['Name', order.customer.fullName],
              ['Email', order.customer.email],
              ['Phone', order.customer.phone],
              ['Address', order.customer.address || '—'],
            ].map(([l, v]) => (
              <div key={l}>
                <p className={labelCls}>{l}</p>
                <p className={valueCls}>{v}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Vehicle info */}
        <div className={sectionCls}>
          <h3 className="text-[10px] font-black text-white tracking-[0.25em] uppercase mb-5">Vehicle</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              ['Make', order.vehicle.make],
              ['Model', order.vehicle.model],
              ['Year', order.vehicle.year],
              ['Engine', order.vehicle.engine || '—'],
            ].map(([l, v]) => (
              <div key={l}>
                <p className={labelCls}>{l}</p>
                <p className={valueCls}>{v}</p>
              </div>
            ))}
            {order.vehicle.currentMods && (
              <div className="col-span-2">
                <p className={labelCls}>Current Modifications</p>
                <p className={`${valueCls} leading-relaxed`}>{order.vehicle.currentMods}</p>
              </div>
            )}
            {order.vehicle.serviceDate && (
              <div>
                <p className={labelCls}>Service Date</p>
                <p className={valueCls}>{order.vehicle.serviceDate}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Order items */}
      <div className={sectionCls}>
        <h3 className="text-[10px] font-black text-white tracking-[0.25em] uppercase mb-5">Order Items</h3>
        <div className="flex flex-col gap-3 mb-5">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between gap-4 py-3 border-b border-zinc-800/40 last:border-0">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 shrink-0 border border-zinc-800"
                  style={{ background: `linear-gradient(135deg, ${item.visualColor}22, #00000044)` }}
                  aria-hidden="true"
                />
                <div>
                  <p className="text-xs font-black text-zinc-200">{item.name}</p>
                  <p className="text-[10px] text-zinc-600">{item.category} · qty {item.quantity}</p>
                </div>
              </div>
              <span className="text-xs font-black text-zinc-300 shrink-0">
                ${(item.price * item.quantity).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
        <div className="flex flex-col items-end gap-1.5 pt-3 border-t border-zinc-800/50">
          <div className="flex gap-8 text-[10px] text-zinc-500">
            <span>Subtotal</span>
            <span>${order.subtotal.toLocaleString()}</span>
          </div>
          <div className="flex gap-8 text-[10px] text-zinc-500">
            <span>Tax</span>
            <span>${order.tax.toLocaleString()}</span>
          </div>
          <div className="flex gap-8 text-sm font-black text-white mt-1">
            <span>Total</span>
            <span>${order.total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Status + notes */}
      <div className={sectionCls}>
        <h3 className="text-[10px] font-black text-white tracking-[0.25em] uppercase mb-5">Update Order</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={`${labelCls} block`}>Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as OrderStatus)}
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-cyan-400/50 text-zinc-100 text-sm px-4 py-3 outline-none transition-colors"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={`${labelCls} block`}>Payment Method</label>
            <p className="text-xs text-zinc-400 mt-2 capitalize">{order.payment}</p>
          </div>
          <div className="sm:col-span-2">
            <label className={`${labelCls} block`}>Internal Notes</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-cyan-400/50 text-zinc-100 text-sm px-4 py-3 outline-none transition-colors resize-y placeholder:text-zinc-600"
              placeholder="Add internal notes…"
            />
          </div>
        </div>
        <div className="flex items-center gap-4 mt-5">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-400 hover:bg-cyan-300 text-black font-black text-xs tracking-[0.25em] uppercase transition-all duration-200 disabled:opacity-50"
          >
            <Save size={12} aria-hidden="true" />
            {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
