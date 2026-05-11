'use client';

import Link from 'next/link';
import { useCartStore } from '@/lib/cart';

interface Props {
  showCheckoutButton?: boolean;
  showItems?: boolean;
  onCheckout?: () => void;
  isSubmitting?: boolean;
}

export default function OrderSummary({
  showCheckoutButton = true,
  showItems = false,
  onCheckout,
  isSubmitting = false,
}: Props) {
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal());
  const tax = useCartStore((s) => s.tax());
  const total = useCartStore((s) => s.total());
  const itemCount = useCartStore((s) => s.itemCount());

  const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="border border-zinc-800/50 bg-zinc-900/20 p-6 lg:p-7 flex flex-col gap-4 sticky top-24">
      <h2 className="text-xs font-black text-white tracking-[0.2em] uppercase mb-1">
        Order Summary
      </h2>

      {/* Item thumbnails list — shown when showItems is true */}
      {showItems && items.length > 0 && (
        <div className="flex flex-col gap-2.5 pb-4 border-b border-zinc-800/50">
          {items.map((item) => {
            const thumb = item.images?.[0];
            return (
              <div key={item.id} className="flex items-center gap-3">
                <div
                  className="shrink-0 w-10 h-10 border border-zinc-800 overflow-hidden"
                  style={thumb ? undefined : {
                    background: `radial-gradient(ellipse at 30% 30%, ${item.visualColor}20, transparent 70%), #0d1117`,
                  }}
                >
                  {thumb ? (
                    <img
                      src={thumb}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div
                        className="w-3 h-3 rounded-sm"
                        style={{ background: item.visualColor, opacity: 0.7 }}
                        aria-hidden="true"
                      />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-zinc-300 truncate">{item.name}</p>
                  <p className="text-[10px] text-zinc-600">×{item.quantity}</p>
                </div>
                <span className="text-xs font-black text-zinc-300 shrink-0">
                  {fmt(item.price * item.quantity)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex flex-col gap-2.5 text-sm">
        <div className="flex justify-between">
          <span className="text-zinc-400">
            Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})
          </span>
          <span className="text-zinc-300 font-semibold">{fmt(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-400">Estimated Tax (10%)</span>
          <span className="text-zinc-300 font-semibold">{fmt(tax)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-400">Shipping</span>
          <span className="text-emerald-400 text-xs font-bold uppercase tracking-wide">
            Calculated at checkout
          </span>
        </div>
      </div>

      <div className="border-t border-zinc-800/50 pt-4 flex justify-between items-baseline">
        <span className="text-sm font-black text-white uppercase tracking-wide">Total</span>
        <span className="text-xl font-black text-cyan-400">{fmt(total)}</span>
      </div>

      {showCheckoutButton && (
        <>
          {onCheckout ? (
            <button
              onClick={onCheckout}
              disabled={isSubmitting || itemCount === 0}
              className="w-full py-4 bg-cyan-400 hover:bg-cyan-300 text-black font-black text-xs tracking-[0.25em] uppercase transition-all duration-200 hover:shadow-[0_0_30px_rgba(0,212,255,0.5)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
            >
              {isSubmitting ? 'Processing…' : 'Place Order'}
            </button>
          ) : (
            <Link
              href="/checkout"
              className="block w-full py-4 bg-cyan-400 hover:bg-cyan-300 text-black font-black text-xs tracking-[0.25em] uppercase text-center transition-all duration-200 hover:shadow-[0_0_30px_rgba(0,212,255,0.5)]"
            >
              Proceed to Checkout
            </Link>
          )}
          <Link
            href="/store"
            className="block text-center text-xs text-zinc-500 hover:text-cyan-400 transition-colors tracking-widest uppercase font-semibold"
          >
            ← Continue Shopping
          </Link>
        </>
      )}

      <p className="text-[10px] text-zinc-500 leading-relaxed text-center">
        Secure mock checkout. No real payment processed.
      </p>
    </div>
  );
}
