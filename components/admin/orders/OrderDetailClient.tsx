'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  AlertCircle,
  CheckCircle2,
  XCircle,
  History,
  StickyNote,
  MessageSquare,
  CreditCard,
  User,
  Car,
  ShoppingCart,
} from 'lucide-react';
import type { Order, OrderStatus, PaymentStatus } from '@/types/admin';
import {
  STATUSES,
  formatStatus,
  PAYMENT_STATUSES,
  formatPaymentStatus,
  ALLOWED_TRANSITIONS,
  canTransition,
} from '@/components/admin/orderStatus';
import OrderStatusBadge from '@/components/orders/OrderStatusBadge';
import PaymentStatusBadge from '@/components/orders/PaymentStatusBadge';
import OrderStatusTimeline from '@/components/orders/OrderStatusTimeline';
import ConfirmDialog from '@/components/admin/ConfirmDialog';

interface Props {
  order: Order;
}

const sectionCls = 'border border-zinc-800/50 bg-zinc-900/20 p-6';
const labelCls = 'text-[9px] text-zinc-600 tracking-[0.2em] uppercase font-bold mb-1';
const valueCls = 'text-xs text-zinc-300';

type SaveField = 'status' | 'payment' | 'adminNotes' | 'customerNotes';

export default function OrderDetailClient({ order: initialOrder }: Props) {
  const [order, setOrder] = useState(initialOrder);

  // Pending changes (not yet saved)
  const [pendingStatus, setPendingStatus] = useState<OrderStatus>(order.status);
  const [pendingPayment, setPendingPayment] = useState<PaymentStatus>(order.paymentStatus);
  const [pendingAdminNotes, setPendingAdminNotes] = useState(order.adminNotes ?? '');
  const [pendingCustomerNotes, setPendingCustomerNotes] = useState(order.customerNotes ?? '');
  const [statusNote, setStatusNote] = useState('');

  const [saving, setSaving] = useState<SaveField | null>(null);
  const [saveError, setSaveError] = useState('');
  const [confirm, setConfirm] = useState<{ field: SaveField; label: string; danger?: boolean } | null>(null);

  const availableTransitions = ALLOWED_TRANSITIONS[order.status];
  const statusChanged = pendingStatus !== order.status;
  const paymentChanged = pendingPayment !== order.paymentStatus;
  const adminNotesChanged = pendingAdminNotes !== (order.adminNotes ?? '');
  const customerNotesChanged = pendingCustomerNotes !== (order.customerNotes ?? '');

  async function doSave(payload: Record<string, unknown>) {
    const res = await fetch(`/api/admin/orders/${order.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as Order & { error?: string };
    if (!res.ok) throw new Error(data.error ?? 'Failed to save');
    return data;
  }

  async function save(field: SaveField) {
    setSaving(field);
    setSaveError('');
    try {
      let payload: Record<string, unknown> = {};
      if (field === 'status') {
        payload = { status: pendingStatus, statusNote: statusNote || undefined };
      } else if (field === 'payment') {
        payload = { paymentStatus: pendingPayment };
      } else if (field === 'adminNotes') {
        payload = { adminNotes: pendingAdminNotes };
      } else {
        payload = { customerNotes: pendingCustomerNotes };
      }
      const updated = await doSave(payload);
      setOrder(updated);
      if (field === 'status') setStatusNote('');
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSaving(null);
    }
  }

  function requestSave(field: SaveField) {
    // Require confirmation for terminal/important transitions
    if (field === 'status') {
      if (pendingStatus === 'cancelled') {
        setConfirm({ field: 'status', label: 'Cancel this order?', danger: true });
        return;
      }
      if (pendingStatus === 'completed') {
        setConfirm({ field: 'status', label: 'Mark order as completed?' });
        return;
      }
    }
    void save(field);
  }

  return (
    <>
      {/* Confirm dialog */}
      <ConfirmDialog
        open={confirm !== null}
        title={confirm?.label ?? ''}
        message={
          confirm?.danger
            ? 'This action cannot be undone without admin intervention. Are you sure?'
            : 'This will update the order status. Continue?'
        }
        confirmLabel={confirm?.danger ? 'Yes, Cancel Order' : 'Confirm'}
        danger={confirm?.danger}
        loading={saving !== null}
        onConfirm={() => {
          const f = confirm!.field;
          setConfirm(null);
          void save(f);
        }}
        onCancel={() => {
          // Revert any pending status change that was triggered by a quick-action
          // button — those set pendingStatus before showing the dialog, so if the
          // admin cancels the dialog the dropdown must revert to the saved value.
          if (confirm?.field === 'status') setPendingStatus(order.status);
          setConfirm(null);
        }}
      />

      <div className="flex flex-col gap-6 max-w-5xl">
        {/* Header row */}
        <div className="flex items-center gap-4 flex-wrap">
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1.5 text-[10px] text-zinc-600 hover:text-cyan-400 font-bold tracking-widest uppercase transition-colors"
          >
            <ArrowLeft size={10} aria-hidden="true" /> Back to Orders
          </Link>
          <OrderStatusBadge status={order.status} size="sm" />
          <PaymentStatusBadge status={order.paymentStatus} size="sm" />
          <span className="text-[10px] text-zinc-700 ml-auto">
            Created {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
          </span>
        </div>

        {/* Customer + Vehicle */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={sectionCls}>
            <h3 className="flex items-center gap-2 text-[10px] font-black text-white tracking-[0.25em] uppercase mb-5">
              <User size={11} className="text-cyan-400" aria-hidden="true" />
              Customer
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {(
                [
                  ['Name', order.customer.fullName],
                  ['Email', order.customer.email],
                  ['Phone', order.customer.phone],
                  ['Address', order.customer.address || '—'],
                ] as [string, string][]
              ).map(([l, v]) => (
                <div key={l}>
                  <p className={labelCls}>{l}</p>
                  <p className={valueCls}>{v}</p>
                </div>
              ))}
            </div>
          </div>

          <div className={sectionCls}>
            <h3 className="flex items-center gap-2 text-[10px] font-black text-white tracking-[0.25em] uppercase mb-5">
              <Car size={11} className="text-cyan-400" aria-hidden="true" />
              Vehicle
            </h3>
            <div className="grid grid-cols-2 gap-4">
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
                <div className="col-span-2">
                  <p className={labelCls}>Current Mods</p>
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
          <h3 className="flex items-center gap-2 text-[10px] font-black text-white tracking-[0.25em] uppercase mb-5">
            <ShoppingCart size={11} className="text-cyan-400" aria-hidden="true" />
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
                      {item.category} · qty {item.quantity} · ${item.price.toLocaleString()} ea
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

        {/* Status management */}
        <div className={sectionCls}>
          <h3 className="flex items-center gap-2 text-[10px] font-black text-white tracking-[0.25em] uppercase mb-5">
            <CheckCircle2 size={11} className="text-cyan-400" aria-hidden="true" />
            Order Status
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-4">
            <div>
              <label className={`${labelCls} block`}>New Status</label>
              <select
                value={pendingStatus}
                onChange={(e) => setPendingStatus(e.target.value as OrderStatus)}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-cyan-400/50 text-zinc-100 text-sm px-4 py-3 outline-none transition-colors"
              >
                {/* Always show current status */}
                <option value={order.status}>{formatStatus(order.status)} (current)</option>
                {STATUSES.filter(
                  (s) => s !== order.status && canTransition(order.status, s)
                ).map((s) => (
                  <option key={s} value={s}>
                    {formatStatus(s)}
                  </option>
                ))}
              </select>
              {availableTransitions.length === 0 && (
                <p className="text-[10px] text-zinc-600 mt-1">
                  This status is final. No further transitions allowed.
                </p>
              )}
            </div>

            <div>
              <label className={`${labelCls} block`}>Note (optional)</label>
              <input
                type="text"
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="Reason for status change…"
                maxLength={200}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-cyan-400/50 text-zinc-100 text-sm px-4 py-3 outline-none transition-colors placeholder:text-zinc-600"
              />
            </div>
          </div>

          <button
            onClick={() => requestSave('status')}
            disabled={!statusChanged || saving !== null}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-black font-black text-xs tracking-[0.2em] uppercase transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Save size={11} aria-hidden="true" />
            {saving === 'status' ? 'Updating…' : 'Update Status'}
          </button>
        </div>

        {/* Payment status */}
        <div className={sectionCls}>
          <h3 className="flex items-center gap-2 text-[10px] font-black text-white tracking-[0.25em] uppercase mb-5">
            <CreditCard size={11} className="text-cyan-400" aria-hidden="true" />
            Payment
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-4">
            <div>
              <label className={`${labelCls} block`}>Payment Method</label>
              <p className="text-xs text-zinc-400 capitalize mt-1">{order.payment}</p>
            </div>
            <div>
              <label className={`${labelCls} block`}>Payment Status</label>
              <select
                value={pendingPayment}
                onChange={(e) => setPendingPayment(e.target.value as PaymentStatus)}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-cyan-400/50 text-zinc-100 text-sm px-4 py-3 outline-none transition-colors"
              >
                {PAYMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {formatPaymentStatus(s)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={() => requestSave('payment')}
            disabled={!paymentChanged || saving !== null}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-black font-black text-xs tracking-[0.2em] uppercase transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Save size={11} aria-hidden="true" />
            {saving === 'payment' ? 'Saving…' : 'Save Payment Status'}
          </button>
        </div>

        {/* Admin notes */}
        <div className={sectionCls}>
          <h3 className="flex items-center gap-2 text-[10px] font-black text-white tracking-[0.25em] uppercase mb-2">
            <StickyNote size={11} className="text-amber-400" aria-hidden="true" />
            Internal Notes
            <span className="text-[9px] text-zinc-700 font-normal tracking-normal ml-1 normal-case">
              (admin only — never shown to customer)
            </span>
          </h3>

          <textarea
            rows={4}
            value={pendingAdminNotes}
            onChange={(e) => setPendingAdminNotes(e.target.value)}
            maxLength={5000}
            className="w-full bg-zinc-900 border border-zinc-800 focus:border-cyan-400/50 text-zinc-100 text-sm px-4 py-3 outline-none transition-colors resize-y placeholder:text-zinc-600 mb-4"
            placeholder="Internal notes, follow-ups, technician comments…"
          />

          <button
            onClick={() => requestSave('adminNotes')}
            disabled={!adminNotesChanged || saving !== null}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-black font-black text-xs tracking-[0.2em] uppercase transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Save size={11} aria-hidden="true" />
            {saving === 'adminNotes' ? 'Saving…' : 'Save Notes'}
          </button>
        </div>

        {/* Customer-visible notes */}
        <div className={sectionCls}>
          <h3 className="flex items-center gap-2 text-[10px] font-black text-white tracking-[0.25em] uppercase mb-2">
            <MessageSquare size={11} className="text-cyan-400" aria-hidden="true" />
            Customer Notes
            <span className="text-[9px] text-zinc-700 font-normal tracking-normal ml-1 normal-case">
              (visible to customer in their order page)
            </span>
          </h3>

          <textarea
            rows={3}
            value={pendingCustomerNotes}
            onChange={(e) => setPendingCustomerNotes(e.target.value)}
            maxLength={2000}
            className="w-full bg-zinc-900 border border-zinc-800 focus:border-cyan-400/50 text-zinc-100 text-sm px-4 py-3 outline-none transition-colors resize-y placeholder:text-zinc-600 mb-4"
            placeholder="Message to the customer about their order…"
          />

          <button
            onClick={() => requestSave('customerNotes')}
            disabled={!customerNotesChanged || saving !== null}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-black font-black text-xs tracking-[0.2em] uppercase transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Save size={11} aria-hidden="true" />
            {saving === 'customerNotes' ? 'Saving…' : 'Save Customer Note'}
          </button>
        </div>

        {/* Status history timeline */}
        <div className={sectionCls}>
          <h3 className="flex items-center gap-2 text-[10px] font-black text-white tracking-[0.25em] uppercase mb-5">
            <History size={11} className="text-cyan-400" aria-hidden="true" />
            Status History
          </h3>
          <OrderStatusTimeline history={order.statusHistory} showActor />
        </div>

        {/* Important dates */}
        <div className={sectionCls}>
          <h3 className="text-[10px] font-black text-white tracking-[0.25em] uppercase mb-4">
            Key Dates
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              ['Created', order.createdAt],
              ['Last Updated', order.updatedAt],
              ['Completed', order.completedAt ?? null],
              ['Cancelled', order.cancelledAt ?? null],
            ].map(([l, v]) => (
              <div key={l as string}>
                <p className={labelCls}>{l as string}</p>
                <p className={valueCls}>
                  {v ? new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions (cancel / complete shortcuts) */}
        {(order.status !== 'completed' && order.status !== 'cancelled') && (
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {canTransition(order.status, 'completed') && (
              <button
                onClick={() => {
                  setPendingStatus('completed');
                  setConfirm({ field: 'status', label: 'Mark order as completed?' });
                }}
                disabled={saving !== null}
                className="inline-flex items-center gap-2 px-5 py-2.5 border border-emerald-400/30 text-emerald-400 hover:bg-emerald-400/10 font-black text-xs tracking-[0.2em] uppercase transition-all duration-200 disabled:opacity-40"
              >
                <CheckCircle2 size={11} aria-hidden="true" />
                Complete Order
              </button>
            )}
            {canTransition(order.status, 'cancelled') && (
              <button
                onClick={() => {
                  setPendingStatus('cancelled');
                  setConfirm({ field: 'status', label: 'Cancel this order?', danger: true });
                }}
                disabled={saving !== null}
                className="inline-flex items-center gap-2 px-5 py-2.5 border border-red-400/30 text-red-400 hover:bg-red-400/10 font-black text-xs tracking-[0.2em] uppercase transition-all duration-200 disabled:opacity-40"
              >
                <XCircle size={11} aria-hidden="true" />
                Cancel Order
              </button>
            )}
          </div>
        )}

        {/* Save error */}
        {saveError && (
          <div className="flex items-center gap-2.5 p-3 border border-red-500/30 bg-red-500/5 text-red-400 text-xs">
            <AlertCircle size={13} className="shrink-0" aria-hidden="true" />
            {saveError}
          </div>
        )}
      </div>
    </>
  );
}
