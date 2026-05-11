import { Star, StarHalf } from 'lucide-react';

interface Props {
  rating: number;
  count?: number;
  size?: number;
  className?: string;
}

export default function StarRating({ rating, count, size = 11, className }: Props) {
  // Sanitize: treat NaN, negative, or non-finite values as 0
  const safeRating = Number.isFinite(rating) && rating >= 0 ? Math.min(rating, 5) : 0;

  // Show fallback when there are no reviews or no meaningful rating
  const isEmpty = safeRating === 0 || count === 0;

  if (isEmpty) {
    return (
      <div className={`flex items-center gap-2 ${className ?? ''}`}>
        <div className="flex items-center gap-0.5" aria-hidden="true">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} size={size} className="text-zinc-700" />
          ))}
        </div>
        <span className="text-[10px] text-zinc-600 font-medium italic">No reviews yet</span>
      </div>
    );
  }

  const fullStars = Math.floor(safeRating);
  const hasHalf = safeRating - fullStars >= 0.25;

  return (
    <div className={`flex items-center gap-2 ${className ?? ''}`}>
      <div className="flex items-center gap-0.5" aria-label={`${safeRating} out of 5 stars`}>
        {Array.from({ length: 5 }).map((_, i) => {
          if (i < fullStars) {
            return (
              <Star
                key={i}
                size={size}
                className="text-amber-400 fill-amber-400"
                aria-hidden="true"
              />
            );
          }
          if (i === fullStars && hasHalf) {
            return (
              <StarHalf
                key={i}
                size={size}
                className="text-amber-400 fill-amber-400"
                aria-hidden="true"
              />
            );
          }
          return (
            <Star
              key={i}
              size={size}
              className="text-zinc-700"
              aria-hidden="true"
            />
          );
        })}
      </div>
      <span className="text-[10px] text-zinc-400 font-semibold">{safeRating}</span>
      {count !== undefined && count > 0 && (
        <span className="text-[10px] text-zinc-600">({count.toLocaleString()})</span>
      )}
    </div>
  );
}
