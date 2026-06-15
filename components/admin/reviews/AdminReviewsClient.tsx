'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Star,
  CheckCircle,
  EyeOff,
  Trash2,
  AlertCircle,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import type { Review, ReviewStatus } from '@/lib/reviews';
import ConfirmDialog from '@/components/admin/ConfirmDialog';

function StatusBadge({ status }: { status: ReviewStatus }) {
  const map: Record<ReviewStatus, { label: string; cls: string }> = {
    approved: {
      label: 'Approved',
      cls: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
    },
    pending: {
      label: 'Pending',
      cls: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    },
    hidden: {
      label: 'Hidden',
      cls: 'border-zinc-600/30 bg-zinc-800/50 text-zinc-500',
    },
  };
  const { label, cls } = map[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 border text-[9px] font-bold tracking-widest uppercase ${cls}`}>
      {label}
    </span>
  );
}

async function fetchReviews(): Promise<Review[]> {
  const res = await fetch('/api/admin/reviews');
  if (!res.ok) throw new Error('Failed to load reviews.');
  const data = (await res.json()) as Review[];
  // Newest first
  data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return data;
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={10}
          className={i <= rating ? 'text-amber-400 fill-amber-400' : 'text-zinc-700'}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

export default function AdminReviewsClient() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [actionError, setActionError] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | 'all'>('all');
  const [ratingFilter, setRatingFilter] = useState<number | 0>(0);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews()
      .then((data) => {
        setReviews(data);
        setFetchError('');
      })
      .catch(() => setFetchError('Failed to load reviews.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return reviews.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (ratingFilter > 0 && r.rating !== ratingFilter) return false;
      if (q) {
        return (
          r.userName.toLowerCase().includes(q) ||
          r.userEmail.toLowerCase().includes(q) ||
          r.productSlug.toLowerCase().includes(q) ||
          (r.title ?? '').toLowerCase().includes(q) ||
          (r.comment ?? '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [reviews, search, statusFilter, ratingFilter]);

  const updateStatus = async (id: string, status: ReviewStatus) => {
    setActionError('');
    setActingId(id);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        setActionError(d.error ?? 'Action failed.');
        return;
      }
      const updated = (await res.json()) as Review;
      setReviews((prev) => prev.map((r) => (r.id === id ? updated : r)));
    } catch {
      setActionError('Action failed. Please try again.');
    } finally {
      setActingId(null);
    }
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    const id = deleteId;
    setDeleteId(null);
    setActionError('');
    fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' })
      .then(async (res) => {
        if (!res.ok) {
          const d = (await res.json()) as { error?: string };
          setActionError(d.error ?? 'Delete failed.');
          return;
        }
        setReviews((prev) => prev.filter((r) => r.id !== id));
      })
      .catch(() => {
        setActionError('Delete failed. Please try again.');
      });
  };

  const inputCls =
    'bg-zinc-900 border border-zinc-800 focus:border-cyan-400/50 text-zinc-100 text-xs px-3 py-2 outline-none transition-colors';
  const selectCls = `${inputCls} appearance-none pr-7 cursor-pointer`;

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search product, customer, title…"
          className={`${inputCls} flex-1 min-w-48`}
        />
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ReviewStatus | 'all')}
            className={selectCls}
            aria-label="Filter by status"
          >
            <option value="all">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="hidden">Hidden</option>
          </select>
          <ChevronDown
            size={11}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
            aria-hidden="true"
          />
        </div>
        <div className="relative">
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(Number(e.target.value))}
            className={selectCls}
            aria-label="Filter by rating"
          >
            <option value={0}>All Ratings</option>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} Star{n !== 1 ? 's' : ''}
              </option>
            ))}
          </select>
          <ChevronDown
            size={11}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
            aria-hidden="true"
          />
        </div>
        <span className="text-[10px] text-zinc-600 font-semibold tracking-wide ml-1">
          {filtered.length} of {reviews.length}
        </span>
      </div>

      {/* Errors */}
      {(fetchError || actionError) && (
        <div className="flex items-center gap-2.5 p-3 border border-red-500/30 bg-red-500/5 text-red-400 text-xs">
          <AlertCircle size={13} className="shrink-0" aria-hidden="true" />
          {fetchError || actionError}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-zinc-600 text-sm">
          Loading reviews…
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
          <p className="text-zinc-500 text-sm font-semibold">No reviews found.</p>
          {(search || statusFilter !== 'all' || ratingFilter > 0) && (
            <button
              onClick={() => { setSearch(''); setStatusFilter('all'); setRatingFilter(0); }}
              className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="border border-zinc-800/50 overflow-x-auto">
          <table className="w-full text-xs text-left min-w-200">
            <thead>
              <tr className="border-b border-zinc-800/50 bg-zinc-900/40">
                {[
                  'Product',
                  'Reviewer',
                  'Rating',
                  'Review',
                  'Status',
                  'Date',
                  'Actions',
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-[9px] text-zinc-500 tracking-[0.2em] uppercase font-bold whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const acting = actingId === r.id;
                return (
                  <tr
                    key={r.id}
                    className={`border-b border-zinc-800/30 transition-opacity ${acting ? 'opacity-50' : 'hover:bg-zinc-900/30'}`}
                  >
                    {/* Product */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-zinc-300 font-semibold">{r.productSlug}</span>
                        <Link
                          href={`/store/${r.productSlug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-zinc-600 hover:text-cyan-400 transition-colors"
                          title="View product"
                        >
                          <ExternalLink size={10} aria-hidden="true" />
                        </Link>
                      </div>
                    </td>

                    {/* Reviewer */}
                    <td className="px-4 py-3">
                      <p className="text-zinc-300 font-semibold">{r.userName}</p>
                      <p className="text-[10px] text-zinc-600 mt-0.5">{r.userEmail}</p>
                    </td>

                    {/* Rating */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <StarRow rating={r.rating} />
                        <span className="text-[10px] text-zinc-500">{r.rating}/5</span>
                      </div>
                    </td>

                    {/* Review text */}
                    <td className="px-4 py-3 max-w-xs">
                      {r.title && (
                        <p className="text-zinc-200 font-semibold mb-0.5 truncate">{r.title}</p>
                      )}
                      {r.comment && (
                        <p className="text-zinc-500 line-clamp-2 leading-relaxed">{r.comment}</p>
                      )}
                      {!r.title && !r.comment && (
                        <span className="text-zinc-700 italic">No text</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 whitespace-nowrap text-zinc-500">
                      {new Date(r.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {r.status !== 'approved' && (
                          <button
                            onClick={() => updateStatus(r.id, 'approved')}
                            disabled={acting}
                            title="Approve"
                            className="p-1.5 text-zinc-600 hover:text-emerald-400 transition-colors border border-transparent hover:border-emerald-400/20 disabled:opacity-40"
                          >
                            <CheckCircle size={13} aria-hidden="true" />
                          </button>
                        )}
                        {r.status !== 'hidden' && (
                          <button
                            onClick={() => updateStatus(r.id, 'hidden')}
                            disabled={acting}
                            title="Hide"
                            className="p-1.5 text-zinc-600 hover:text-amber-400 transition-colors border border-transparent hover:border-amber-400/20 disabled:opacity-40"
                          >
                            <EyeOff size={13} aria-hidden="true" />
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteId(r.id)}
                          disabled={acting}
                          title="Delete"
                          className="p-1.5 text-zinc-600 hover:text-red-400 transition-colors border border-transparent hover:border-red-400/20 disabled:opacity-40"
                        >
                          <Trash2 size={13} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Review"
        message="Are you sure you want to permanently delete this review? This action cannot be undone."
        confirmLabel="Delete"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
