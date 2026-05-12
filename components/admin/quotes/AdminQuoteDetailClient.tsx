'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  AlertCircle,
  CheckCircle2,
  Car,
  User,
  Wrench,
  MessageSquare,
  StickyNote,
  Package,
  Phone,
} from 'lucide-react';
import type { QuoteRequest, QuoteStatus, QuotePriority } from '@/types/quotes';
import {
  QUOTE_STATUSES,
  QUOTE_PRIORITIES,
  formatQuoteStatus,
  formatQuotePriority,
} from '@/types/quotes';
import QuoteStatusBadge from '@/components/quotes/QuoteStatusBadge';
import QuotePriorityBadge from '@/components/quotes/QuotePriorityBadge';
import ConfirmDialog from '@/components/admin/ConfirmDialog';

interface Props {
  quote: QuoteRequest;
}

const sectionCls = 'border border-zinc-800/50 bg-zinc-900/20 p-6';
const labelCls = 'text-[9px] text-zinc-600 tracking-[0.2em] uppercase font-bold mb-1';
const valueCls = 'text-xs text-zinc-300';

type SaveField = 'status' | 'priority' | 'adminNotes' | 'customerReply';

export default function AdminQuoteDetailClient({ quote: initialQuote }: Props) {
  const [quote, setQuote] = useState(initialQuote);

  const [pendingStatus, setPendingStatus] = useState<QuoteStatus>(quote.status);
  const [pendingPriority, setPendingPriority] = useState<QuotePriority>(quote.priority);
  const [pendingAdminNotes, setPendingAdminNotes] = useState(quote.adminNotes ?? '');
  const [pendingCustomerReply, setPendingCustomerReply] = useState(quote.customerReply ?? '');

  const [saving, setSaving] = useState<SaveField | null>(null);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState<SaveField | null>(null);
  const [confirm, setConfirm] = useState<{ field: SaveField; label: string; danger?: boolean } | null>(null);

  const statusChanged = pendingStatus !== quote.status;
  const priorityChanged = pendingPriority !== quote.priority;
  const adminNotesChanged = pendingAdminNotes !== (quote.adminNotes ?? '');
  const customerReplyChanged = pendingCustomerReply !== (quote.customerReply ?? '');

  const patch = async (field: SaveField, body: Record<string, unknown>) => {
    setSaving(field);
    setSaveError('');
    setSaveSuccess(null);
    try {
      const res = await fetch(`/api/admin/quotes/${quote.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json() as QuoteRequest & { error?: string };
      if (!res.ok) {
        setSaveError(data.error ?? 'Save failed');
        return;
      }
      setQuote(data);
      setSaveSuccess(field);
      setTimeout(() => setSaveSuccess(null), 2500);
    } catch {
      setSaveError('Network error. Please try again.');
    } finally {
      setSaving(null);
      setConfirm(null);
    }
  };

  const DANGEROUS_STATUSES: QuoteStatus[] = ['rejected', 'closed'];
  const isDangerous = DANGEROUS_STATUSES.includes(pendingStatus) && pendingStatus !== quote.status;

  const handleSaveStatus = () => {
    if (isDangerous) {
      setConfirm({
        field: 'status',
        label: `Mark as "${formatQuoteStatus(pendingStatus)}"?`,
        danger: true,
      });
    } else {
      void patch('status', { status: pendingStatus });
    }
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Back + header */}
        <div>
          <Link
            href="/admin/quotes"
            className="inline-flex items-center gap-2 text-[10px] text-zinc-600 hover:text-cyan-400 transition-colors mb-4"
          >
            <ArrowLeft size={12} aria-hidden="true" />
            All Quotes
          </Link>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-2xl font-black text-white tracking-wider">{quote.quoteNumber}</p>
              <p className="text-[10px] text-zinc-600 mt-1">
                Submitted{' '}
                {new Date(quote.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <QuotePriorityBadge priority={quote.priority} />
              <QuoteStatusBadge status={quote.status} />
            </div>
          </div>
        </div>

        {/* Global save error */}
        {saveError && (
          <div className="flex items-start gap-3 border border-red-400/30 bg-red-400/5 p-4">
            <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-xs text-red-300">{saveError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
          {/* Left: Quote details */}
          <div className="flex flex-col gap-6">
            {/* Customer */}
            <div className={sectionCls}>
              <div className="flex items-center gap-2 mb-4">
                <User size={13} className="text-cyan-400" aria-hidden="true" />
                <h2 className="text-xs font-black text-white tracking-[0.2em] uppercase">Customer</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <p className={labelCls}>Name</p>
                  <p className={valueCls}>{quote.customerName}</p>
                </div>
                <div>
                  <p className={labelCls}>Email</p>
                  <a
                    href={`mailto:${quote.customerEmail}`}
                    className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    {quote.customerEmail}
                  </a>
                </div>
                <div>
                  <p className={labelCls}>Phone</p>
                  <a
                    href={`tel:${quote.customerPhone}`}
                    className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
                  >
                    <Phone size={10} aria-hidden="true" />
                    {quote.customerPhone}
                  </a>
                </div>
                <div>
                  <p className={labelCls}>Preferred Contact</p>
                  <p className={valueCls} style={{ textTransform: 'capitalize' }}>
                    {quote.preferredContactMethod}
                  </p>
                </div>
                {quote.userId && (
                  <div>
                    <p className={labelCls}>Account</p>
                    <Link
                      href={`/admin/users`}
                      className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      Registered User
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Vehicle */}
            <div className={sectionCls}>
              <div className="flex items-center gap-2 mb-4">
                <Car size={13} className="text-cyan-400" aria-hidden="true" />
                <h2 className="text-xs font-black text-white tracking-[0.2em] uppercase">Vehicle</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <p className={labelCls}>Make</p>
                  <p className={valueCls}>{quote.vehicleMake}</p>
                </div>
                <div>
                  <p className={labelCls}>Model</p>
                  <p className={valueCls}>{quote.vehicleModel}</p>
                </div>
                <div>
                  <p className={labelCls}>Year</p>
                  <p className={valueCls}>{quote.vehicleYear}</p>
                </div>
                {quote.vehicleEngine && (
                  <div>
                    <p className={labelCls}>Engine</p>
                    <p className={valueCls}>{quote.vehicleEngine}</p>
                  </div>
                )}
                {quote.transmission && (
                  <div>
                    <p className={labelCls}>Transmission</p>
                    <p className={valueCls}>{quote.transmission}</p>
                  </div>
                )}
                {quote.mileage && (
                  <div>
                    <p className={labelCls}>Mileage</p>
                    <p className={valueCls}>{quote.mileage}</p>
                  </div>
                )}
                {quote.currentModifications && (
                  <div className="col-span-2 sm:col-span-3">
                    <p className={labelCls}>Current Modifications</p>
                    <p className={`${valueCls} leading-relaxed`}>{quote.currentModifications}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Project */}
            <div className={sectionCls}>
              <div className="flex items-center gap-2 mb-4">
                <Wrench size={13} className="text-cyan-400" aria-hidden="true" />
                <h2 className="text-xs font-black text-white tracking-[0.2em] uppercase">Project Details</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className={labelCls}>Service Category</p>
                  <p className={valueCls}>{quote.serviceCategory}</p>
                </div>
                {quote.performanceGoal && (
                  <div>
                    <p className={labelCls}>Performance Goal</p>
                    <p className={valueCls}>{quote.performanceGoal}</p>
                  </div>
                )}
                {quote.budgetRange && (
                  <div>
                    <p className={labelCls}>Budget Range</p>
                    <p className={valueCls}>{quote.budgetRange}</p>
                  </div>
                )}
                {quote.desiredTimeline && (
                  <div>
                    <p className={labelCls}>Timeline</p>
                    <p className={valueCls}>{quote.desiredTimeline}</p>
                  </div>
                )}
              </div>
              <div>
                <p className={labelCls}>Description</p>
                <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap border border-zinc-800/50 bg-zinc-900/30 p-4">
                  {quote.message}
                </p>
              </div>
            </div>

            {/* Related product */}
            {quote.relatedProductName && (
              <div className={sectionCls}>
                <div className="flex items-center gap-2 mb-4">
                  <Package size={13} className="text-cyan-400" aria-hidden="true" />
                  <h2 className="text-xs font-black text-white tracking-[0.2em] uppercase">Related Product</h2>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-zinc-300">{quote.relatedProductName}</p>
                    {quote.relatedProductSlug && (
                      <p className="text-[10px] text-zinc-600 mt-0.5">/store/{quote.relatedProductSlug}</p>
                    )}
                  </div>
                  {quote.relatedProductSlug && (
                    <Link
                      href={`/store/${quote.relatedProductSlug}`}
                      target="_blank"
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold tracking-wide transition-colors"
                    >
                      View →
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Customer reply */}
            <div className={sectionCls}>
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <MessageSquare size={13} className="text-cyan-400" aria-hidden="true" />
                  <h2 className="text-xs font-black text-white tracking-[0.2em] uppercase">
                    Customer-Visible Reply
                  </h2>
                </div>
                {saveSuccess === 'customerReply' && (
                  <CheckCircle2 size={13} className="text-emerald-400" aria-hidden="true" />
                )}
              </div>
              <p className="text-[10px] text-zinc-600 mb-3 leading-relaxed">
                This message is visible to the customer on their quotes page.
              </p>
              <textarea
                value={pendingCustomerReply}
                onChange={(e) => setPendingCustomerReply(e.target.value)}
                rows={5}
                placeholder="Add a message visible to the customer…"
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-cyan-400/50 text-zinc-100 text-sm px-4 py-3 outline-none transition-colors resize-none placeholder:text-zinc-600 mb-3"
                maxLength={2000}
              />
              <button
                onClick={() => void patch('customerReply', { customerReply: pendingCustomerReply })}
                disabled={!customerReplyChanged || saving === 'customerReply'}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 disabled:cursor-not-allowed text-black font-black text-[10px] tracking-[0.15em] uppercase transition-colors"
              >
                <Save size={11} aria-hidden="true" />
                {saving === 'customerReply' ? 'Saving…' : 'Save Reply'}
              </button>
            </div>

            {/* Admin notes */}
            <div className={sectionCls}>
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <StickyNote size={13} className="text-amber-400" aria-hidden="true" />
                  <h2 className="text-xs font-black text-white tracking-[0.2em] uppercase">
                    Internal Notes
                  </h2>
                  <span className="text-[9px] text-amber-400/70 border border-amber-400/20 bg-amber-400/5 px-1.5 py-0.5 font-bold tracking-wide">
                    NOT VISIBLE TO CUSTOMER
                  </span>
                </div>
                {saveSuccess === 'adminNotes' && (
                  <CheckCircle2 size={13} className="text-emerald-400" aria-hidden="true" />
                )}
              </div>
              <textarea
                value={pendingAdminNotes}
                onChange={(e) => setPendingAdminNotes(e.target.value)}
                rows={5}
                placeholder="Add private notes for the team…"
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-400/40 text-zinc-100 text-sm px-4 py-3 outline-none transition-colors resize-none placeholder:text-zinc-600 mb-3"
              />
              <button
                onClick={() => void patch('adminNotes', { adminNotes: pendingAdminNotes })}
                disabled={!adminNotesChanged || saving === 'adminNotes'}
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-zinc-700 hover:border-zinc-600 bg-zinc-900/40 hover:bg-zinc-800/40 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-300 font-black text-[10px] tracking-[0.15em] uppercase transition-colors"
              >
                <Save size={11} aria-hidden="true" />
                {saving === 'adminNotes' ? 'Saving…' : 'Save Notes'}
              </button>
            </div>
          </div>

          {/* Right: Actions panel */}
          <div className="flex flex-col gap-4">
            {/* Status */}
            <div className={sectionCls}>
              <h2 className="text-xs font-black text-white tracking-[0.2em] uppercase mb-4">
                Status
              </h2>
              <select
                value={pendingStatus}
                onChange={(e) => setPendingStatus(e.target.value as QuoteStatus)}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-cyan-400/50 text-zinc-100 text-xs px-3 py-2.5 outline-none transition-colors mb-3"
              >
                {QUOTE_STATUSES.map((s) => (
                  <option key={s} value={s}>{formatQuoteStatus(s)}</option>
                ))}
              </select>
              <button
                onClick={handleSaveStatus}
                disabled={!statusChanged || saving === 'status'}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 disabled:cursor-not-allowed text-black font-black text-[10px] tracking-[0.15em] uppercase transition-colors"
              >
                {saving === 'status' ? (
                  'Saving…'
                ) : (
                  <>
                    <Save size={11} aria-hidden="true" />
                    Update Status
                  </>
                )}
              </button>
              {saveSuccess === 'status' && (
                <p className="text-[10px] text-emerald-400 text-center mt-2">Status updated</p>
              )}
            </div>

            {/* Priority */}
            <div className={sectionCls}>
              <h2 className="text-xs font-black text-white tracking-[0.2em] uppercase mb-4">
                Priority
              </h2>
              <select
                value={pendingPriority}
                onChange={(e) => setPendingPriority(e.target.value as QuotePriority)}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-cyan-400/50 text-zinc-100 text-xs px-3 py-2.5 outline-none transition-colors mb-3"
              >
                {QUOTE_PRIORITIES.map((p) => (
                  <option key={p} value={p}>{formatQuotePriority(p)}</option>
                ))}
              </select>
              <button
                onClick={() => void patch('priority', { priority: pendingPriority })}
                disabled={!priorityChanged || saving === 'priority'}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-zinc-700 hover:border-zinc-600 bg-zinc-900/40 hover:bg-zinc-800/40 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-300 font-black text-[10px] tracking-[0.15em] uppercase transition-colors"
              >
                {saving === 'priority' ? (
                  'Saving…'
                ) : (
                  <>
                    <Save size={11} aria-hidden="true" />
                    Update Priority
                  </>
                )}
              </button>
              {saveSuccess === 'priority' && (
                <p className="text-[10px] text-emerald-400 text-center mt-2">Priority updated</p>
              )}
            </div>

            {/* Timeline */}
            <div className={sectionCls}>
              <h2 className="text-xs font-black text-white tracking-[0.2em] uppercase mb-4">
                Timeline
              </h2>
              <div className="flex flex-col gap-2.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-zinc-600">Received</span>
                  <span className="text-zinc-400">
                    {new Date(quote.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {quote.contactedAt && (
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Contacted</span>
                    <span className="text-zinc-400">
                      {new Date(quote.contactedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {quote.quotedAt && (
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Quoted</span>
                    <span className="text-zinc-400">
                      {new Date(quote.quotedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-zinc-600">Updated</span>
                  <span className="text-zinc-400">
                    {new Date(quote.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Convert to order — placeholder, non-breaking */}
            <div className={sectionCls}>
              <h2 className="text-xs font-black text-white tracking-[0.2em] uppercase mb-3">
                Convert to Order
              </h2>
              <p className="text-[10px] text-zinc-600 leading-relaxed mb-4">
                Once a price has been agreed, convert this quote to a service order.
              </p>
              {quote.convertedToOrderId ? (
                <div className="flex flex-col gap-2">
                  <p className="text-[10px] text-teal-400 font-bold">Already converted</p>
                  <Link
                    href={`/admin/orders/${quote.convertedToOrderId}`}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    View Order →
                  </Link>
                </div>
              ) : (
                <button
                  disabled
                  title="TODO: implement full order creation from quote"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-zinc-800 bg-zinc-900/30 opacity-40 cursor-not-allowed text-zinc-500 font-black text-[10px] tracking-[0.15em] uppercase"
                >
                  Convert to Order
                </button>
              )}
              <p className="text-[9px] text-zinc-700 mt-2 leading-relaxed">
                Full conversion flow: coming soon
              </p>
            </div>

            {/* Quick actions */}
            <div className={sectionCls}>
              <h2 className="text-xs font-black text-white tracking-[0.2em] uppercase mb-4">
                Quick Actions
              </h2>
              <div className="flex flex-col gap-2">
                {(['contacted', 'quoted', 'accepted', 'rejected'] as QuoteStatus[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      if (DANGEROUS_STATUSES.includes(s)) {
                        setPendingStatus(s);
                        setConfirm({
                          field: 'status',
                          label: `Mark as "${formatQuoteStatus(s)}"?`,
                          danger: true,
                        });
                      } else {
                        void patch('status', { status: s });
                      }
                    }}
                    disabled={quote.status === s || saving !== null}
                    className={`text-left px-3 py-2 text-[10px] font-bold tracking-wide border transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                      s === 'rejected'
                        ? 'border-red-400/20 text-red-400/80 hover:bg-red-400/5 hover:border-red-400/30'
                        : 'border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900/40'
                    }`}
                  >
                    Mark as {formatQuoteStatus(s)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm dialog for dangerous status changes */}
      <ConfirmDialog
        open={confirm !== null}
        title={confirm?.label ?? ''}
        message="This action will update the quote status. Are you sure?"
        confirmLabel="Confirm"
        danger={confirm?.danger}
        onConfirm={() => {
          if (confirm) void patch('status', { status: pendingStatus });
        }}
        onCancel={() => {
          setConfirm(null);
          setPendingStatus(quote.status);
        }}
      />
    </>
  );
}
