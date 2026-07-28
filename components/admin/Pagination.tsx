'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

/** Shared pager for the admin tables. Renders nothing for a single page. */
export default function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const btn =
    'inline-flex items-center gap-1.5 px-4 py-2 border border-zinc-800 hover:border-cyan-400/40 text-zinc-400 hover:text-cyan-400 text-[10px] font-black tracking-[0.2em] uppercase transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-zinc-800 disabled:hover:text-zinc-400';

  return (
    <div className="flex items-center justify-between mt-5">
      <button onClick={() => onChange(Math.max(1, page - 1))} disabled={page <= 1} className={btn}>
        <ChevronLeft size={13} aria-hidden="true" />
        Prev
      </button>

      <span className="text-[10px] text-zinc-600 tracking-[0.2em] uppercase font-bold">
        Page {page} of {totalPages}
      </span>

      <button
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        className={btn}
      >
        Next
        <ChevronRight size={13} aria-hidden="true" />
      </button>
    </div>
  );
}
