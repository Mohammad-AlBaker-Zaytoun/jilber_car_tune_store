'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';

interface Props {
  value: number; // 0 = nothing selected, 1–5
  onChange: (rating: number) => void;
  disabled?: boolean;
  size?: number;
}

const LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

export default function StarSelector({ value, onChange, disabled, size = 28 }: Props) {
  const [hover, setHover] = useState(0);
  const active = hover || value;

  return (
    <div className="flex items-center gap-1.5">
      <div
        className="flex items-center gap-1"
        role="group"
        aria-label="Select your rating"
        onMouseLeave={() => setHover(0)}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={disabled}
            onClick={() => onChange(star)}
            onMouseEnter={() => setHover(star)}
            aria-label={`Rate ${star} star${star !== 1 ? 's' : ''} — ${LABELS[star]}`}
            aria-pressed={value === star}
            className="transition-transform duration-100 hover:scale-110 focus:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Star
              size={size}
              className={
                star <= active
                  ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.5)]'
                  : 'text-zinc-700'
              }
              aria-hidden="true"
            />
          </button>
        ))}
      </div>
      {active > 0 && (
        <span className="text-xs font-semibold text-amber-400 min-w-16">
          {LABELS[active]}
        </span>
      )}
    </div>
  );
}
