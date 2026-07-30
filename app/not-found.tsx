import Link from 'next/link';
import { Compass, Home, ShoppingBag } from 'lucide-react';

/**
 * Branded 404. Reached by any unmatched URL and by every `notFound()` call —
 * notably `/store/[slug]` for a product that does not exist, which previously
 * rendered Next's stock 404 page.
 */
export default function NotFound() {
  return (
    <div className="bg-zinc-950 min-h-svh flex items-center justify-center px-6 py-24">
      <div className="max-w-lg w-full text-center">
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 flex items-center justify-center border border-cyan-400/30 bg-cyan-400/5">
            <Compass size={28} className="text-cyan-400" aria-hidden="true" />
          </div>
        </div>

        <p className="text-[10px] text-cyan-400 tracking-[0.35em] uppercase font-bold mb-4">
          404 — Not found
        </p>
        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-none mb-5">
          WRONG
          <br />
          <span className="text-cyan-400">TURN</span>
        </h1>
        <p className="text-sm text-zinc-400 leading-relaxed mb-10">
          This page does not exist. It may have been moved, or the product you are
          looking for is no longer listed.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/store"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-cyan-400 hover:bg-cyan-300 text-black font-black text-xs tracking-[0.2em] uppercase transition-all duration-200 hover:shadow-[0_0_24px_rgba(0,212,255,0.5)]"
          >
            <ShoppingBag size={13} aria-hidden="true" />
            Browse the Store
          </Link>
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
