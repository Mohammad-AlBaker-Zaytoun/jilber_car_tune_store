'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import StarSelector from './StarSelector';
import type { PublicReview } from '@/lib/reviews.dev';

interface CreatePayload {
  productId: string;
  rating: number;
  title?: string;
  comment?: string;
}

interface EditPayload {
  rating?: number;
  title?: string;
  comment?: string;
}

interface Props {
  mode: 'create' | 'edit';
  productId?: string; // required for create
  existingReview?: PublicReview; // required for edit
  onSuccess: (review: PublicReview) => void;
  onCancel?: () => void;
}

const inputCls =
  'w-full bg-zinc-900 border border-zinc-800 focus:border-cyan-400/50 text-zinc-100 text-sm px-4 py-3 outline-none transition-colors placeholder:text-zinc-600 resize-none';
const labelCls =
  'block text-[10px] text-zinc-500 tracking-[0.2em] uppercase font-bold mb-1.5';

export default function ReviewForm({
  mode,
  productId,
  existingReview,
  onSuccess,
  onCancel,
}: Props) {
  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [title, setTitle] = useState(existingReview?.title ?? '');
  const [comment, setComment] = useState(existingReview?.comment ?? '');
  const [ratingError, setRatingError] = useState('');
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = (): boolean => {
    if (rating < 1 || rating > 5) {
      setRatingError('Please select a rating.');
      return false;
    }
    setRatingError('');
    if (title.length > 120) {
      setServerError('Title must be 120 characters or fewer.');
      return false;
    }
    if (comment.length > 1000) {
      setServerError('Comment must be 1000 characters or fewer.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;
    setSubmitting(true);

    try {
      let res: Response;
      if (mode === 'create') {
        const payload: CreatePayload = {
          productId: productId!,
          rating,
          title: title.trim() || undefined,
          comment: comment.trim() || undefined,
        };
        res = await fetch('/api/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        const payload: EditPayload = {
          rating,
          title: title.trim() || undefined,
          comment: comment.trim() || undefined,
        };
        res = await fetch(`/api/reviews/${existingReview!.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = (await res.json()) as { error?: string } & Partial<PublicReview>;
      if (!res.ok) {
        setServerError(data.error ?? 'Something went wrong. Please try again.');
        return;
      }

      // Show the success banner first, then notify the parent after a short pause so
      // the message is actually visible before the parent unmounts this form.
      setSuccess(true);
      await new Promise<void>((resolve) => setTimeout(resolve, 900));
      onSuccess(data as PublicReview);
    } catch {
      setServerError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex items-center gap-3 p-4 border border-cyan-400/30 bg-cyan-400/5 text-cyan-400">
        <CheckCircle size={14} aria-hidden="true" />
        <p className="text-xs font-semibold">
          {mode === 'create'
            ? 'Your review was submitted successfully.'
            : 'Your review has been updated.'}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {serverError && (
        <div className="flex items-center gap-2.5 p-3 border border-red-500/30 bg-red-500/5 text-red-400 text-xs">
          <AlertCircle size={13} className="shrink-0" aria-hidden="true" />
          {serverError}
        </div>
      )}

      <div>
        <p className={labelCls}>
          Your Rating <span className="text-cyan-400">*</span>
        </p>
        <StarSelector
          value={rating}
          onChange={(v) => { setRating(v); setRatingError(''); }}
          disabled={submitting}
          size={26}
        />
        {ratingError && (
          <p className="text-red-400 text-[10px] mt-1">{ratingError}</p>
        )}
      </div>

      <div>
        <label className={labelCls} htmlFor="review-title">
          Review Title <span className="text-zinc-600">(optional)</span>
        </label>
        <input
          id="review-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          disabled={submitting}
          className={inputCls}
          placeholder="Summarise your experience"
        />
        {title.length > 100 && (
          <p className="text-[10px] text-zinc-600 mt-1 text-right">
            {120 - title.length} chars remaining
          </p>
        )}
      </div>

      <div>
        <label className={labelCls} htmlFor="review-comment">
          Review <span className="text-zinc-600">(optional)</span>
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={1000}
          disabled={submitting}
          rows={4}
          className={inputCls}
          placeholder="Share your experience with this product…"
        />
        {comment.length > 800 && (
          <p className="text-[10px] text-zinc-600 mt-1 text-right">
            {1000 - comment.length} chars remaining
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-3 bg-cyan-400 hover:bg-cyan-300 text-black font-black text-xs tracking-[0.2em] uppercase transition-all duration-200 hover:shadow-[0_0_20px_rgba(0,212,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting
            ? mode === 'create'
              ? 'Submitting…'
              : 'Saving…'
            : mode === 'create'
            ? 'Submit Review'
            : 'Save Changes'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="px-5 py-3 border border-zinc-700 hover:border-zinc-600 text-zinc-400 hover:text-zinc-200 font-black text-xs tracking-[0.2em] uppercase transition-all duration-200 disabled:opacity-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
