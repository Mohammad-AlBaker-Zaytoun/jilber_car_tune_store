'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Star, MessageSquare, Lock } from 'lucide-react';
import type { PublicReview } from '@/lib/reviews';
import type { SessionUser } from '@/lib/auth';
import ReviewCard from './ReviewCard';
import ReviewForm from './ReviewForm';

interface Props {
  productId: string;
  productSlug: string;
  adminRating: number; // product.rating fallback
  adminReviewCount: number; // product.reviewCount fallback
  session: SessionUser | null;
  initialReviews: PublicReview[];
  initialUserReview: PublicReview | null;
}

function calcAvg(reviews: Pick<PublicReview, 'rating'>[]): number {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={i <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-zinc-700'}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

function RatingSummary({
  reviews,
  adminRating,
  adminReviewCount,
}: {
  reviews: PublicReview[];
  adminRating: number;
  adminReviewCount: number;
}) {
  const hasCustomer = reviews.length > 0;
  const avg = hasCustomer ? calcAvg(reviews) : adminRating;
  const count = hasCustomer ? reviews.length : adminReviewCount;
  const hasAny = avg > 0 && count > 0;

  if (!hasAny) {
    return (
      <div className="flex items-center gap-3 py-4 border-b border-zinc-800/50">
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} size={16} className="text-zinc-700" aria-hidden="true" />
          ))}
        </div>
        <span className="text-sm text-zinc-600 font-medium">No reviews yet</span>
      </div>
    );
  }

  // Per-star breakdown (customer reviews only)
  const breakdown = hasCustomer
    ? [5, 4, 3, 2, 1].map((star) => ({
        star,
        count: reviews.filter((r) => r.rating === star).length,
        pct:
          reviews.length > 0
            ? Math.round((reviews.filter((r) => r.rating === star).length / reviews.length) * 100)
            : 0,
      }))
    : null;

  return (
    <div className="flex flex-col sm:flex-row gap-6 py-4 border-b border-zinc-800/50">
      {/* Big number */}
      <div className="flex flex-col items-center gap-1 min-w-20">
        <span className="text-4xl font-black text-white">{avg}</span>
        <StarRow rating={avg} size={14} />
        <span className="text-[10px] text-zinc-600 font-medium text-center mt-1">
          {hasCustomer ? (
            <>
              Based on {count} customer {count === 1 ? 'review' : 'reviews'}
            </>
          ) : (
            <>Store rating · {count} {count === 1 ? 'review' : 'reviews'}</>
          )}
        </span>
      </div>

      {/* Bar breakdown — only when we have customer data */}
      {breakdown && (
        <div className="flex flex-col gap-1.5 flex-1 justify-center">
          {breakdown.map(({ star, count: cnt, pct }) => (
            <div key={star} className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-500 w-3 text-right shrink-0">{star}</span>
              <Star size={9} className="text-zinc-600 shrink-0" aria-hidden="true" />
              <div className="flex-1 h-1.5 bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-amber-400/70 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-[10px] text-zinc-600 w-5 shrink-0">{cnt}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProductReviewsSection({
  productId,
  productSlug,
  adminRating,
  adminReviewCount,
  session,
  initialReviews,
  initialUserReview,
}: Props) {
  const [reviews, setReviews] = useState<PublicReview[]>(initialReviews);
  const [userReview, setUserReview] = useState<PublicReview | null>(initialUserReview);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const refreshReviews = useCallback(async () => {
    try {
      const res = await fetch(`/api/reviews?productId=${encodeURIComponent(productId)}`);
      if (res.ok) {
        const data = (await res.json()) as PublicReview[];
        setReviews(data);
      }
    } catch {
      // silently ignore refresh failures
    }
  }, [productId]);

  const handleCreateSuccess = (review: PublicReview) => {
    setUserReview(review);
    if (review.status === 'approved') {
      void refreshReviews();
    }
  };

  const handleEditSuccess = (review: PublicReview) => {
    setUserReview(review);
    setIsEditMode(false);
    void refreshReviews();
  };

  const handleDelete = async () => {
    if (!userReview) return;
    setDeleteError('');
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/reviews/${userReview.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setDeleteError(data.error ?? 'Could not delete review.');
        return;
      }
      setUserReview(null);
      setIsEditMode(false);
      void refreshReviews();
    } catch {
      setDeleteError('Something went wrong. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Reviews visible to everyone (exclude the user's own if shown separately)
  const publicList = session
    ? reviews.filter((r) => r.userId !== session.id)
    : reviews;

  const showForm = session && !userReview && !isEditMode;
  const showEditForm = session && userReview && isEditMode;

  return (
    <section
      aria-labelledby="reviews-heading"
      className="border border-zinc-800/50 bg-zinc-900/20"
    >
      {/* Section header */}
      <div className="flex items-center gap-2.5 px-7 pt-7 pb-5 border-b border-zinc-800/50">
        <MessageSquare size={13} className="text-cyan-400" aria-hidden="true" />
        <h2
          id="reviews-heading"
          className="text-xs font-black text-white tracking-[0.25em] uppercase"
        >
          Customer Reviews
        </h2>
      </div>

      <div className="px-7 py-6 flex flex-col gap-7">
        {/* Rating summary */}
        <RatingSummary
          reviews={reviews}
          adminRating={adminRating}
          adminReviewCount={adminReviewCount}
        />

        {/* User's own review */}
        {userReview && !isEditMode && (
          <div>
            <p className="text-[10px] text-zinc-500 tracking-[0.2em] uppercase font-bold mb-3">
              Your Review
            </p>
            {deleteError && (
              <p className="text-red-400 text-xs mb-2">{deleteError}</p>
            )}
            <ReviewCard
              review={userReview}
              isOwn
              onEdit={() => setIsEditMode(true)}
              onDelete={handleDelete}
              isDeleting={isDeleting}
            />
          </div>
        )}

        {/* Edit form */}
        {showEditForm && (
          <div>
            <p className="text-[10px] text-zinc-500 tracking-[0.2em] uppercase font-bold mb-3">
              Edit Your Review
            </p>
            <ReviewForm
              mode="edit"
              existingReview={userReview!}
              onSuccess={handleEditSuccess}
              onCancel={() => setIsEditMode(false)}
            />
          </div>
        )}

        {/* Create form */}
        {showForm && (
          <div className="border border-zinc-800/50 bg-zinc-950/40 p-6">
            <p className="text-[10px] text-zinc-500 tracking-[0.2em] uppercase font-bold mb-4">
              Write a Review
            </p>
            <ReviewForm
              mode="create"
              productId={productId}
              onSuccess={handleCreateSuccess}
            />
          </div>
        )}

        {/* Sign-in CTA */}
        {!session && (
          <div className="flex items-center gap-3 p-4 border border-zinc-800/50 bg-zinc-950/40">
            <Lock size={14} className="text-zinc-600 shrink-0" aria-hidden="true" />
            <p className="text-sm text-zinc-500">
              <Link
                href={`/signin?redirect=/store/${productSlug}`}
                className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
              >
                Sign in
              </Link>{' '}
              to write a review.
            </p>
          </div>
        )}

        {/* Public review list */}
        <div>
          {publicList.length > 0 ? (
            <div className="flex flex-col gap-3">
              <p className="text-[10px] text-zinc-500 tracking-[0.2em] uppercase font-bold">
                {publicList.length} {publicList.length === 1 ? 'Review' : 'Reviews'}
              </p>
              {publicList.map((r) => (
                <ReviewCard key={r.id} review={r} />
              ))}
            </div>
          ) : (
            !userReview && (
              <div className="text-center py-8 flex flex-col items-center gap-2">
                <div className="flex items-center gap-0.5 mb-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} size={18} className="text-zinc-800" aria-hidden="true" />
                  ))}
                </div>
                <p className="text-sm text-zinc-600 font-medium">No customer reviews yet.</p>
                {session ? (
                  <p className="text-xs text-zinc-700">Be the first to review this product.</p>
                ) : (
                  <p className="text-xs text-zinc-700">
                    <Link
                      href={`/signin?redirect=/store/${productSlug}`}
                      className="text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      Sign in
                    </Link>{' '}
                    to be the first to review this product.
                  </p>
                )}
              </div>
            )
          )}
        </div>
      </div>
    </section>
  );
}
