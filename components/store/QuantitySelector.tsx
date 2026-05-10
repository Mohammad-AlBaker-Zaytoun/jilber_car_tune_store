'use client';

import { Minus, Plus } from 'lucide-react';

interface Props {
  quantity: number;
  onChange: (q: number) => void;
  min?: number;
  max?: number;
}

export default function QuantitySelector({ quantity, onChange, min = 1, max = 99 }: Props) {
  return (
    <div className="inline-flex items-center border border-zinc-700">
      <button
        onClick={() => onChange(Math.max(min, quantity - 1))}
        disabled={quantity <= min}
        className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-cyan-400 hover:bg-zinc-800 transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Decrease quantity"
      >
        <Minus size={13} aria-hidden="true" />
      </button>
      <span className="w-12 text-center text-sm font-black text-white select-none">
        {quantity}
      </span>
      <button
        onClick={() => onChange(Math.min(max, quantity + 1))}
        disabled={quantity >= max}
        className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-cyan-400 hover:bg-zinc-800 transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Increase quantity"
      >
        <Plus size={13} aria-hidden="true" />
      </button>
    </div>
  );
}
