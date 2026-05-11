'use client';

import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import type { CartItem } from '@/lib/cart';
import { useCartStore } from '@/lib/cart';
import QuantitySelector from '@/components/store/QuantitySelector';

export default function CartItemRow({ item }: { item: CartItem }) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const thumb = item.images?.[0];

  return (
    <div className="flex gap-4 py-5 border-b border-zinc-800/50 last:border-0">
      {/* Thumbnail */}
      <div
        className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 border border-zinc-800 overflow-hidden"
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
              className="w-5 h-5 rounded-sm"
              style={{ background: item.visualColor, opacity: 0.7 }}
            />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <span
          className="text-[9px] font-bold tracking-[0.25em] uppercase"
          style={{ color: item.visualColor }}
        >
          {item.category}
        </span>
        <Link
          href={`/store/${item.slug}`}
          className="text-sm font-black text-white hover:text-cyan-400 transition-colors leading-snug line-clamp-2"
        >
          {item.name}
        </Link>
        <p className="text-xs text-zinc-500">
          {item.currency} {item.price.toLocaleString()} each
        </p>

        {/* Controls row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-1">
          <QuantitySelector
            quantity={item.quantity}
            onChange={(q) => updateQuantity(item.id, q)}
          />
          <span className="text-sm font-black text-white">
            ${(item.price * item.quantity).toLocaleString()}
          </span>
          <button
            onClick={() => removeItem(item.id)}
            className="ml-auto text-zinc-600 hover:text-red-400 transition-colors"
            aria-label={`Remove ${item.name}`}
          >
            <Trash2 size={14} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
