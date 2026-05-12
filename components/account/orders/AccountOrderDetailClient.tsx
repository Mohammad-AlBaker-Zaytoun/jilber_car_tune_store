'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { Order } from '@/types/admin';
import OrderStatusBadge from '@/components/orders/OrderStatusBadge';
import PaymentStatusBadge from '@/components/orders/PaymentStatusBadge';
import OrderStatusTimeline from '@/components/orders/OrderStatusTimeline';

interface Props {
  order: Omit<Order, 'adminNotes'>;
}

const sectionCls = 'border border-zinc-800/50 bg-zinc-900/20 p-5';
const labelCls = 'text-[9px] text-zinc-600 tracking-[0.2em] uppercase font-bold mb-1';
const valueCls = 'text-xs text-zinc-300';

export default function AccountOrderDetailClient({ order }: Props) {
  return (
    <div className="flex flex-col gap-5">
      {/* Back + header */}
      <div className="flex items-center gap-4 flex-wrap">
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-1.5 text-[10px] text-zinc-600 hover:text-cyan-400 font-bold tracking-widest uppercase transition-colors"
        >
          <ArrowLeft size={10} aria-hidden="true" /> Back
        </Link>
        <OrderStatusBadge status={order.status} size="sm" />
        <PaymentStatusBadge status={order.paymentStatus} size="sm" />
      </div>

      {/* Reference + date */}
      <div>
        <p className="text-[10px] text-zinc-600 tracking-[0.2em] uppercase font-bold mb-1">
          Order Reference
        </p>
        <p className="text-2xl font-black text-white tracking-[0.1em]">{order.ref}</p>
        <p className="text-[10px] text-zinc-600 mt-1">
          Placed on{' '}
          {new Date(order.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Vehicle */}
      <div className={sectionCls}>
        <h3 className="text-[10px] font-black text-white tracking-[0.25em] uppercase mb-4">
          Vehicle
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {(
            [
              ['Make', order.vehicle.make],
              ['Model', order.vehicle.model],
              ['Year', order.vehicle.year],
              ['Engine', order.vehicle.engine || '—'],
            ] as [string, string][]
          ).map(([l, v]) => (
            <div key={l}>
              <p className={labelCls}>{l}</p>
              <p className={valueCls}>{v}</p>
            </div>
          ))}
          {order.vehicle.currentMods && (
            <div className="col-span-2 sm:col-span-3">
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

      {/* Items */}
      <div className={sectionCls}>
        <h3 className="text-[10px] font-black text-white tracking-[0.25em] uppercase mb-4">
          Order Items
        </h3>
        <div className="flex flex-col gap-3 mb-5">
          {order.items.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-4 py-3 border-b border-zinc-800/40 last:border-0"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 shrink-0 border border-zinc-800"
                  style={{ background: `linear-gradient(135deg, ${item.visualColor}22, #00000044)` }}
                  aria-hidden="true"
                />
                <div>
                  <p className="text-xs font-black text-zinc-200">{item.name}</p>
                  <p className="text-[10px] text-zinc-600">
                    {item.category} · qty {item.quantity}
                  </p>
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

      {/* Customer note from admin */}
      {order.customerNotes && (
        <div className={sectionCls}>
          <h3 className="text-[10px] font-black text-white tracking-[0.25em] uppercase mb-3">
            Message from Workshop
          </h3>
          <p className="text-sm text-zinc-300 leading-relaxed">{order.customerNotes}</p>
        </div>
      )}

      {/* Status timeline */}
      <div className={sectionCls}>
        <h3 className="text-[10px] font-black text-white tracking-[0.25em] uppercase mb-4">
          Order History
        </h3>
        <OrderStatusTimeline history={order.statusHistory} showActor={false} />
      </div>
    </div>
  );
}
