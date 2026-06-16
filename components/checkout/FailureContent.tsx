'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { XCircle, CreditCard, ShoppingBag } from 'lucide-react';

export default function FailureContent() {
  const params = useSearchParams();
  const ref = params.get('ref');

  return (
    <div className="bg-zinc-950 min-h-screen pt-28 lg:pt-36 pb-24">
      <div className="max-w-2xl mx-auto px-6 lg:px-8">
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 flex items-center justify-center border border-red-500/30 bg-red-500/5">
            <XCircle size={36} className="text-red-400" aria-hidden="true" />
          </div>
        </div>

        <div className="text-center mb-10">
          <p className="text-[10px] text-red-400 tracking-[0.35em] uppercase font-bold mb-4">
            Payment Not Completed
          </p>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-none mb-4">
            PAYMENT
            <br />
            <span className="text-red-400">UNSUCCESSFUL</span>
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-md mx-auto">
            Your payment didn&apos;t go through, so your order is not yet confirmed. Your
            cart is still saved — you can try again or choose another payment method.
          </p>
          {ref && (
            <p className="text-xs text-zinc-600 mt-4">
              Reference:{' '}
              <span className="text-zinc-400 tracking-[0.15em] font-bold">{ref}</span>
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/checkout"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-cyan-400 hover:bg-cyan-300 text-black font-black text-xs tracking-[0.2em] uppercase transition-all duration-200 hover:shadow-[0_0_24px_rgba(0,212,255,0.5)]"
          >
            <CreditCard size={13} aria-hidden="true" />
            Return to Checkout
          </Link>
          <Link
            href="/store"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 border border-zinc-700 hover:border-cyan-400/40 text-zinc-300 hover:text-cyan-400 font-black text-xs tracking-[0.2em] uppercase transition-all duration-200"
          >
            <ShoppingBag size={13} aria-hidden="true" />
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
