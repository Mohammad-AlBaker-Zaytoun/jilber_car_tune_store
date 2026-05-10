'use client';

import { Search, SlidersHorizontal } from 'lucide-react';
import { CATEGORIES, type Category } from '@/data/products';

export type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'rating';

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  activeCategory: Category | null;
  onCategoryChange: (c: Category | null) => void;
  sort: SortOption;
  onSortChange: (s: SortOption) => void;
  resultCount: number;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: Low → High' },
  { value: 'price-desc', label: 'Price: High → Low' },
  { value: 'rating', label: 'Top Rated' },
];

export default function ProductFilters({
  search,
  onSearchChange,
  activeCategory,
  onCategoryChange,
  sort,
  onSortChange,
  resultCount,
}: Props) {
  return (
    <div className="flex flex-col gap-5">
      {/* Search + sort row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            placeholder="Search products…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 focus:border-cyan-400/50 text-zinc-100 text-xs px-4 py-3 pl-9 outline-none transition-colors duration-200 placeholder:text-zinc-600"
          />
        </div>

        <div className="relative shrink-0">
          <SlidersHorizontal
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
            aria-hidden="true"
          />
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="appearance-none bg-zinc-900 border border-zinc-800 focus:border-cyan-400/50 text-zinc-300 text-xs px-4 py-3 pl-8 pr-8 outline-none transition-colors duration-200 cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onCategoryChange(null)}
          className={`px-3 py-1.5 text-[10px] font-bold tracking-[0.2em] uppercase border transition-all duration-200 ${
            activeCategory === null
              ? 'border-cyan-400/50 bg-cyan-400/10 text-cyan-400'
              : 'border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'
          }`}
        >
          All
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => onCategoryChange(cat === activeCategory ? null : cat)}
            className={`px-3 py-1.5 text-[10px] font-bold tracking-[0.15em] uppercase border transition-all duration-200 ${
              activeCategory === cat
                ? 'border-cyan-400/50 bg-cyan-400/10 text-cyan-400'
                : 'border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Result count */}
      <p className="text-[10px] text-zinc-600 tracking-[0.15em] uppercase font-semibold">
        {resultCount} {resultCount === 1 ? 'product' : 'products'}
        {activeCategory ? ` in ${activeCategory}` : ''}
      </p>
    </div>
  );
}
