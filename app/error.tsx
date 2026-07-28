'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Home, RotateCcw } from 'lucide-react';

/**
 * Route-level error boundary. Catches render errors in any Server or Client
 * Component below it and shows a branded page instead of Next's default error
 * screen (which the app previously fell through to, since no error.tsx existed).
 *
 * `digest` is the server-side error id — the same value logged by the
 * onRequestError hook in instrumentation.ts, so a customer can quote it and we
 * can find the exact stack trace.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // The server error is already captured by onRequestError; this covers
    // client-side render failures, which never reach the server at all.
    if (typeof window !== 'undefined') {
      console.error(
        JSON.stringify({
          ts: new Date().toISOString(),
          level: 'error',
          event: 'client.render_error',
          digest: error.digest,
          message: error.message,
        })
      );
    }
  }, [error]);

  return (
    <div className="bg-zinc-950 min-h-screen flex items-center justify-center px-6 py-24">
      <div className="max-w-lg w-full text-center">
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 flex items-center justify-center border border-red-500/30 bg-red-500/5">
            <AlertTriangle size={28} className="text-red-400" aria-hidden="true" />
          </div>
        </div>

        <p className="text-[10px] text-red-400 tracking-[0.35em] uppercase font-bold mb-4">
          Something went wrong
        </p>
        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-none mb-5">
          UNEXPECTED
          <br />
          <span className="text-red-400">ERROR</span>
        </h1>
        <p className="text-sm text-zinc-400 leading-relaxed mb-8">
          This page failed to load. The problem has been logged. Try again, and if
          it keeps happening please get in touch.
        </p>

        {error.digest && (
          <p className="text-[10px] text-zinc-600 tracking-[0.2em] uppercase font-semibold mb-8">
            Reference: <span className="text-zinc-400 font-mono">{error.digest}</span>
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-cyan-400 hover:bg-cyan-300 text-black font-black text-xs tracking-[0.2em] uppercase transition-all duration-200 hover:shadow-[0_0_24px_rgba(0,212,255,0.5)]"
          >
            <RotateCcw size={13} aria-hidden="true" />
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 border border-zinc-700 hover:border-cyan-400/40 text-zinc-300 hover:text-cyan-400 font-black text-xs tracking-[0.2em] uppercase transition-all duration-200"
          >
            <Home size={13} aria-hidden="true" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
