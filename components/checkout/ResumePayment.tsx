'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CreditCard, CheckCircle, AlertTriangle, ShoppingBag } from 'lucide-react';
import { formatMoney } from '@/lib/currency';

interface Props {
  orderId: string;
  /** Passed straight back to the API, which re-verifies it independently. */
  token: string;
  orderRef: string;
  total: number;
  alreadyPaid: boolean;
}

/**
 * "Pay for this order" — the recovery step for an order captured without payment.
 *
 * Deliberately requires a click rather than auto-redirecting on mount: email
 * clients and link scanners prefetch URLs, and a payment session must only ever
 * be created by a deliberate human action.
 */
export default function ResumePayment({
  orderId,
  token,
  orderRef,
  total,
  alreadyPaid,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [settled, setSettled] = useState(alreadyPaid);

  const pay = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(
        `/api/orders/${encodeURIComponent(orderId)}/pay?token=${encodeURIComponent(token)}`,
        { method: 'POST' }
      );
      const data = (await res.json()) as {
        collectUrl?: string;
        alreadyPaid?: boolean;
        error?: string;
      };

      // The API settles any previous attempt before creating a new one, so it can
      // legitimately come back "already paid" — that is a success, not an error.
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

  if (settled) {
    return (
      <div className="bg-zinc-950 min-h-screen flex items-center justify-center px-6 py-24">
        <div className="max-w-lg w-full text-center">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 flex items-center justify-center border border-emerald-500/30 bg-emerald-500/5">
              <CheckCircle size={28} className="text-emerald-400" aria-hidden="true" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-4">
            THIS ORDER IS PAID
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed mb-2">
            No further payment is needed for{' '}
            <span className="font-mono text-zinc-300">{orderRef}</span>.
          </p>
          <p className="text-xs text-zinc-600 mb-8">
            If you believe you were charged twice, contact us and we will check.
          </p>
          <Link
            href="/store"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 border border-zinc-700 hover:border-cyan-400/40 text-zinc-300 hover:text-cyan-400 font-black text-xs tracking-[0.2em] uppercase transition-colors"
          >
            <ShoppingBag size={13} aria-hidden="true" />
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-950 min-h-screen flex items-center justify-center px-6 py-24">
      <div className="max-w-lg w-full">
        <div className="border border-zinc-800/50 bg-zinc-900/20 p-8">
          <p className="text-[10px] text-cyan-400 tracking-[0.35em] uppercase font-bold mb-4">
            Complete your payment
          </p>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none mb-6">
            PAY FOR YOUR ORDER
          </h1>

          <div className="border-t border-b border-zinc-800/50 py-5 mb-6 flex items-baseline justify-between">
            <div>
              <p className="text-[10px] text-zinc-500 tracking-[0.2em] uppercase font-bold mb-1">
                Order
              </p>
              <p className="text-sm text-zinc-300 font-mono">{orderRef}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-zinc-500 tracking-[0.2em] uppercase font-bold mb-1">
                Amount
              </p>
              <p className="text-xl font-black text-cyan-400">{formatMoney(total)}</p>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 p-4 mb-6 border border-red-500/30 bg-red-500/5 text-red-400 text-xs leading-relaxed">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={pay}
            disabled={busy}
            className="w-full inline-flex items-center justify-center gap-2 py-4 bg-cyan-400 hover:bg-cyan-300 text-black font-black text-xs tracking-[0.25em] uppercase transition-all duration-200 hover:shadow-[0_0_30px_rgba(0,212,255,0.5)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
          >
            <CreditCard size={14} aria-hidden="true" />
            {busy ? 'Starting payment…' : 'Pay now'}
          </button>

          <p className="text-[10px] text-zinc-500 leading-relaxed text-center mt-5">
            Card payments are processed securely by Whish Money. Your card details
            are entered on their payment page and never reach our servers.
          </p>
        </div>

        <p className="text-xs text-zinc-600 text-center mt-6">
          Prefer to pay in person? You can settle this at the workshop instead — no
          action needed here.
        </p>
      </div>
    </div>
  );
}
