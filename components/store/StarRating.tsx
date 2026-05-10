import { Star } from 'lucide-react';

interface Props {
  rating: number;
  count?: number;
  size?: number;
}

export default function StarRating({ rating, count, size = 11 }: Props) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={size}
            className={i < Math.floor(rating) ? 'text-amber-400 fill-amber-400' : 'text-zinc-700'}
            aria-hidden="true"
          />
        ))}
      </div>
      <span className="text-[10px] text-zinc-400 font-semibold">{rating}</span>
      {count !== undefined && (
        <span className="text-[10px] text-zinc-600">({count})</span>
      )}
    </div>
  );
}
