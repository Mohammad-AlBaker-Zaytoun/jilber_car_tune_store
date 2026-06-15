'use client';

import { Star, Pencil, Trash2 } from 'lucide-react';
import type { PublicReview } from '@/lib/reviews';

interface Props {
  review: PublicReview;
  isOwn?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={11}
          className={i <= rating ? 'text-amber-400 fill-amber-400' : 'text-zinc-700'}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

export default function ReviewCard({
  review,
  isOwn,
  onEdit,
  onDelete,
  isDeleting,
}: Props) {
  const initials = review.userName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // Use UTC to guarantee identical output on server and client, preventing hydration mismatches.
  const date = new Date(review.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });

  return (
    <article
      className={`border p-5 flex flex-col gap-3 transition-opacity duration-200 ${
        isOwn
          ? 'border-cyan-400/30 bg-cyan-400/5'
          : 'border-zinc-800/50 bg-zinc-900/20'
      } ${isDeleting ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 shrink-0 flex items-center justify-center border border-zinc-800 bg-zinc-900/60">
            <span className="text-[10px] font-black text-zinc-400">{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-white truncate leading-tight">
              {review.userName}
              {isOwn && (
                <span className="ml-2 text-[9px] text-cyan-400 font-semibold tracking-widest uppercase">
                  You
                </span>
              )}
            </p>
            <p className="text-[10px] text-zinc-600 mt-0.5">{date}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <StarRow rating={review.rating} />
          {isOwn && (
            <div className="flex items-center gap-1">
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="p-1.5 text-zinc-600 hover:text-cyan-400 transition-colors border border-zinc-800/50 hover:border-cyan-400/30"
                  aria-label="Edit your review"
                  title="Edit review"
                >
                  <Pencil size={11} aria-hidden="true" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={onDelete}
                  disabled={isDeleting}
                  className="p-1.5 text-zinc-600 hover:text-red-400 transition-colors border border-zinc-800/50 hover:border-red-400/30 disabled:opacity-50"
                  aria-label="Delete your review"
                  title="Delete review"
                >
                  <Trash2 size={11} aria-hidden="true" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {review.title && (
        <p className="text-sm font-bold text-white leading-snug">{review.title}</p>
      )}
      {review.comment && (
        <p className="text-sm text-zinc-400 leading-relaxed">{review.comment}</p>
      )}

      {isOwn && review.status === 'pending' && (
        <p className="text-[10px] text-amber-400/80 font-medium tracking-wide">
          Your review is awaiting approval and is not yet visible to other customers.
        </p>
      )}
      {isOwn && review.status === 'hidden' && (
        <p className="text-[10px] text-zinc-500 font-medium tracking-wide">
          Your review has been hidden by a moderator and is not visible to other customers.
        </p>
      )}
    </article>
  );
}
