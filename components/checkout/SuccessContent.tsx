'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle, Home, ShoppingBag, Calendar, Mail, Package } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

export default function SuccessContent() {
  const params = useSearchParams();
  // Lazy initializer runs once — keeps Math.random out of the render body (purity).
  const [fallbackRef] = useState(() => `TUNE-${Math.floor(10000 + Math.random() * 90000)}`);
  const ref = params.get('ref') ?? fallbackRef;
  const { user } = useAuth();

  return (
    <div className="bg-zinc-950 min-h-screen pt-28 lg:pt-36 pb-24">
      <div className="max-w-2xl mx-auto px-6 lg:px-8">
        {/* Success icon */}
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 flex items-center justify-center border border-cyan-400/30 bg-cyan-400/5">
            <CheckCircle size={36} className="text-cyan-400" aria-hidden="true" />
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-10">
          <p className="text-[10px] text-cyan-400 tracking-[0.35em] uppercase font-bold mb-4">
            Order Confirmed
          </p>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-none mb-4">
            REQUEST
            <br />
            <span className="text-cyan-400">RECEIVED</span>
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-md mx-auto">
            Thank you for your order. A member of our team will contact you within
            24 hours to confirm your booking and discuss next steps.
          </p>
        </div>

        {/* Order reference card */}
        <div className="border border-zinc-800/50 bg-zinc-900/20 p-8 mb-8">
          <div className="text-center mb-8">
            <p className="text-[10px] text-zinc-500 tracking-[0.25em] uppercase font-semibold mb-2">
              Order Reference
            </p>
            <p className="text-3xl font-black text-white tracking-[0.15em]">{ref}</p>
            <p className="text-xs text-zinc-600 mt-2">Save this for your records</p>
          </div>

          <div className="border-t border-zinc-800/50 pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: Mail,
                title: 'Confirmation Email',
                body: 'Check your inbox for order details.',
              },
              {
                icon: Calendar,
                title: 'Scheduling',
                body: 'We\'ll contact you to confirm your service date.',
              },
              {
                icon: CheckCircle,
                title: 'What\'s Next',
                body: 'Bring your vehicle on the agreed date.',
              },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex flex-col items-center text-center gap-2">
                <div className="w-9 h-9 flex items-center justify-center border border-zinc-700/50 bg-zinc-900">
                  <Icon size={14} className="text-cyan-400" aria-hidden="true" />
                </div>
                <p className="text-[10px] font-black text-white tracking-widest uppercase">{title}</p>
                <p className="text-xs text-zinc-500 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {user ? (
            <Link
              href="/account/orders"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-cyan-400 hover:bg-cyan-300 text-black font-black text-xs tracking-[0.2em] uppercase transition-all duration-200 hover:shadow-[0_0_24px_rgba(0,212,255,0.5)]"
            >
              <Package size={13} aria-hidden="true" />
              View My Orders
            </Link>
          ) : (
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-cyan-400 hover:bg-cyan-300 text-black font-black text-xs tracking-[0.2em] uppercase transition-all duration-200 hover:shadow-[0_0_24px_rgba(0,212,255,0.5)]"
            >
              <Home size={13} aria-hidden="true" />
              Back to Home
            </Link>
          )}
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
