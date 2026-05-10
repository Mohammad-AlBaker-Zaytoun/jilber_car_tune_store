import Link from 'next/link';
import { SearchX, ShoppingBag } from 'lucide-react';

interface Props {
  variant?: 'no-results' | 'empty-cart';
  onReset?: () => void;
  searchTerm?: string;
  activeCategory?: string | null;
}

export default function EmptyState({ variant = 'no-results', onReset, searchTerm, activeCategory }: Props) {
  if (variant === 'empty-cart') {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-center">
        <div className="w-16 h-16 flex items-center justify-center border border-zinc-800 bg-zinc-900/40 mb-6">
          <ShoppingBag size={24} className="text-zinc-600" aria-hidden="true" />
        </div>
        <h2 className="text-xl font-black text-white mb-2">Your cart is empty</h2>
        <p className="text-sm text-zinc-500 max-w-xs leading-relaxed mb-8">
          You haven&apos;t added anything yet. Head to the store to find your next upgrade.
        </p>
        <Link
          href="/store"
          className="px-6 py-3 bg-cyan-400 hover:bg-cyan-300 text-black font-black text-xs tracking-[0.2em] uppercase transition-all duration-200 hover:shadow-[0_0_24px_rgba(0,212,255,0.5)]"
        >
          Browse Store
        </Link>
      </div>
    );
  }

  const contextLine = searchTerm && activeCategory
    ? `No results for "${searchTerm}" in ${activeCategory}.`
    : searchTerm
    ? `No results for "${searchTerm}".`
    : activeCategory
    ? `No products in ${activeCategory}.`
    : 'No products found.';

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center col-span-full">
      <div className="w-16 h-16 flex items-center justify-center border border-zinc-800 bg-zinc-900/40 mb-6">
        <SearchX size={24} className="text-zinc-600" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-black text-white mb-2">{contextLine}</h3>
      <p className="text-sm text-zinc-500 max-w-xs leading-relaxed mb-6">
        Try adjusting your search or filter to find what you&apos;re looking for.
      </p>
      {onReset && (
        <button
          onClick={onReset}
          className="px-5 py-2.5 border border-zinc-700 hover:border-cyan-400/40 text-zinc-400 hover:text-cyan-400 text-xs font-bold tracking-[0.2em] uppercase transition-all duration-200"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}
