'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search, SlidersHorizontal } from 'lucide-react';
import { type Category } from '@/data/products';

export type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'rating';

interface Props {
  /** Category names from the DB, resolved server-side. */
  categories: string[];
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

/**
 * Collapsed height of the category strip.
 *
 * A chip is ~29px and the gap is 8px, so the row pitch is ~37px: roughly two
 * rows on a phone, three from `sm` up. Expanded is capped in viewport units so
 * a long list scrolls inside itself instead of pushing the catalogue off screen.
 */
const COLLAPSED = 'max-h-[4.6rem] sm:max-h-[7.1rem] overflow-hidden';
const EXPANDED = 'max-h-[45vh] overflow-y-auto';

export default function ProductFilters({
  categories,
  search,
  onSearchChange,
  activeCategory,
  onCategoryChange,
  sort,
  onSortChange,
  resultCount,
}: Props) {
  const listRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  /**
   * Whether the collapsed strip is actually hiding anything.
   *
   * Measured rather than derived from a category count, because how many chips
   * fit depends on the words in them and the viewport width — an 8-category
   * shop should never see a pointless "show all" button, and a 43-category one
   * must see it on every screen size.
   *
   * Only measured while collapsed: once expanded the element grows to fit, so
   * measuring then would report no overflow and the control would vanish,
   * trapping the list open.
   */
  const measure = useCallback(() => {
    const el = listRef.current;
    if (!el || expanded) return;
    setOverflows(el.scrollHeight > el.clientHeight + 4);
  }, [expanded]);

  useEffect(() => {
    measure();
    const el = listRef.current;
    if (!el) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [measure, categories]);

  /**
   * While collapsed, the selected category is pulled to the front so it is
   * never hidden in the clipped overflow — otherwise filtering by a category
   * far down the list leaves no visible sign of which filter is active.
   */
  const ordered = useMemo(() => {
    if (!activeCategory || expanded) return categories;
    const rest = categories.filter((c) => c !== activeCategory);
    return categories.includes(activeCategory) ? [activeCategory, ...rest] : categories;
  }, [categories, activeCategory, expanded]);

  const chipClass = (selected: boolean) =>
    `px-3 py-1.5 text-[10px] font-bold tracking-[0.15em] uppercase border transition-all duration-200 whitespace-nowrap ${
      selected
        ? 'border-cyan-400/50 bg-cyan-400/10 text-cyan-400'
        : 'border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'
    }`;

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
            className="appearance-none bg-zinc-900 border border-zinc-800 focus:border-cyan-400/50 text-zinc-300 text-xs px-4 py-3 pl-8 pr-8 outline-none transition-colors duration-200 cursor-pointer w-full sm:w-auto"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Category chips — clipped until asked for */}
      <div className="relative">
        <div
          ref={listRef}
          id="category-filters"
          className={`flex flex-wrap gap-2 transition-[max-height] duration-300 ease-out ${
            expanded ? EXPANDED : COLLAPSED
          }`}
        >
          <button onClick={() => onCategoryChange(null)} className={chipClass(activeCategory === null)}>
            All
          </button>
          {ordered.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat === activeCategory ? null : cat)}
              className={chipClass(activeCategory === cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Fade hints that the strip continues. Pointer-events off so it never
            eats a tap on the chip beneath it. */}
        {!expanded && overflows && (
          <div
            aria-hidden="true"
            className="absolute bottom-0 left-0 right-0 h-6 pointer-events-none bg-gradient-to-t from-[#060a10] to-transparent"
          />
        )}
      </div>

      {(overflows || expanded) && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-controls="category-filters"
          className="self-start inline-flex items-center gap-1.5 py-1.5 text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500 hover:text-cyan-400 transition-colors duration-200"
        >
          {expanded ? 'Show fewer' : `All ${categories.length} categories`}
          <ChevronDown
            size={12}
            aria-hidden="true"
            className={`transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
          />
        </button>
      )}

      {/* Result count */}
      <p className="text-[10px] text-zinc-600 tracking-[0.15em] uppercase font-semibold">
        {resultCount} {resultCount === 1 ? 'product' : 'products'}
        {activeCategory ? ` in ${activeCategory}` : ''}
      </p>
    </div>
  );
}
