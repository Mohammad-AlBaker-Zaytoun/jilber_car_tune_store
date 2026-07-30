'use client';

import { useState } from 'react';
import { CreditCard, AlertTriangle, CheckCircle } from 'lucide-react';
import { formatMoney } from '@/lib/currency';

interface Props {
  orderId: string;
  orderRef: string;
  total: number;
  /** Order payment METHOD ('shop' | 'bank' | 'card'). */
  payment: string;
  paymentStatus: string;
  status: string;
}

/**
 * "Pay now" for a card order whose payment never completed.
 *
 * Renders nothing unless the order is genuinely awaiting online payment, so it
 * stays invisible for pay-at-workshop and bank-transfer orders. The server
 * re-checks all of these conditions — this is presentation only.
 *
 * Mirrors the allow-list in lib/orders.ts `SETTLEABLE_PAYMENT_STATUSES`: showing
 * this on a refunded or already-paid order would invite a double charge.
 */
const SETTLEABLE = ['unpaid', 'deposit_pending'];

export default function PayNowPanel({
  orderId,
  orderRef,
  total,
  payment,
  paymentStatus,
  status,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [settled, setSettled] = useState(false);

  const eligible =
    payment === 'card' && status !== 'cancelled' && SETTLEABLE.includes(paymentStatus);

  if (!eligible && !settled) return null;

  if (settled) {
    return (
      <div className="border border-emerald-500/30 bg-emerald-500/5 p-5 flex items-start gap-3">
        <CheckCircle size={16} className="text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <p className="text-[10px] font-black text-emerald-400 tracking-[0.2em] uppercase mb-1">
            Payment received
          </p>
          <p className="text-xs text-zinc-300">
            {orderRef} is paid. Reload to see the updated status.
          </p>
        </div>
      </div>
    );
  }

  const pay = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/pay`, {
        method: 'POST',
      });
      const data = (await res.json()) as {
        collectUrl?: string;
        alreadyPaid?: boolean;
        error?: string;
      };

      // The API settles any earlier attempt before starting a new one, so
      // "already paid" is a legitimate success response here.
      if (data.alreadyPaid) {
        setSettled(true);
        return;
      }
      if (!res.ok || !data.collectUrl) {
        setError(data.error ?? 'Could not start the payment. Please try again shortly.');
        return;
      }
      window.location.href = data.collectUrl;
    } catch {
      setError('Could not reach the payment service. Please try again shortly.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border border-amber-500/30 bg-amber-500/5 p-5">
      <div className="flex items-start gap-3 mb-4">
        <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <p className="text-[10px] font-black text-amber-400 tracking-[0.2em] uppercase mb-1">
            Payment outstanding
          </p>
          <p className="text-xs text-zinc-300 leading-relaxed">
            This order has not been paid yet. You can pay {formatMoney(total)} securely
            online now, or settle it at the workshop.
          </p>
        </div>
      </div>

      {error && (
        <p className="text-[11px] text-red-400 leading-relaxed mb-3">{error}</p>
      )}

      <button
        onClick={pay}
        disabled={busy}
        className="inline-flex items-center gap-2 px-5 py-3 bg-cyan-400 hover:bg-cyan-300 text-black font-black text-[10px] tracking-[0.2em] uppercase transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <CreditCard size={12} aria-hidden="true" />
        {busy ? 'Starting…' : 'Pay now'}
      </button>
    </div>
  );
}
