'use client';

import Link from 'next/link';
import { AlertTriangle, LayoutDashboard, RotateCcw } from 'lucide-react';

/**
 * Admin-scoped error boundary.
 *
 * Separate from the shop boundary so a failure in one admin screen keeps the
 * operator inside the panel instead of bouncing them to the storefront, and so
 * the copy can be blunt — this audience wants the error reference, not
 * reassurance.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-24">
      <div className="max-w-lg w-full">
        <div className="border border-red-500/30 bg-red-500/5 p-8">
          <div className="flex items-center gap-3 mb-5">
            <AlertTriangle size={20} className="text-red-400 shrink-0" aria-hidden="true" />
            <h1 className="text-sm font-black text-white tracking-[0.2em] uppercase">
              Admin page failed
            </h1>
          </div>

          <p className="text-sm text-zinc-400 leading-relaxed mb-5">
            This screen could not load. The error has been logged with the
            reference below — quote it when checking the server logs.
          </p>

          <div className="border border-zinc-800 bg-zinc-950 p-4 mb-6">
            <p className="text-[10px] text-zinc-500 tracking-[0.2em] uppercase font-bold mb-1.5">
              Error reference
            </p>
            <p className="text-xs text-zinc-300 font-mono break-all">
              {error.digest ?? 'none (client-side error — check the browser console)'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-cyan-400 hover:bg-cyan-300 text-black font-black text-xs tracking-[0.2em] uppercase transition-colors"
            >
              <RotateCcw size={13} aria-hidden="true" />
              Retry
            </button>
            <Link
              href="/admin"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 border border-zinc-700 hover:border-cyan-400/40 text-zinc-300 hover:text-cyan-400 font-black text-xs tracking-[0.2em] uppercase transition-colors"
            >
              <LayoutDashboard size={13} aria-hidden="true" />
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
