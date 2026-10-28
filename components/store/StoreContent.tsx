'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Category } from '@/data/products';
import type { ListingProduct } from '@/lib/product-listing';
import ProductFilters from './ProductFilters';
import { compareProducts, type SortOption } from '@/lib/product-sort';
import { paginate, pageWindow, STORE_PAGE_SIZE } from '@/lib/pagination';
import ProductCard from './ProductCard';
import EmptyState from './EmptyState';

interface Props {
  products: ListingProduct[];
  /** Category names from the DB — the storefront filter must reflect what an
   *  admin has actually created, not a hardcoded list. */
  categories: string[];
  /** Map of productId → effective { rating, count } computed server-side. */
  ratings?: Record<string, { rating: number; count: number }>;
}

export default function StoreContent({ products, categories, ratings }: Props) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [sort, setSort] = useState<SortOption>('featured');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products
      .filter((p) => !activeCategory || p.category === activeCategory)
      .filter(
        (p) =>
          !q ||
          p.name.toLowerCase().includes(q) ||
          p.shortDescription.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      )
      .sort(compareProducts(sort, ratings));
  }, [products, search, activeCategory, sort, ratings]);

  // Search runs over the whole catalogue; only the visible page is rendered.
  // `paginate` clamps, so a page number left over from a wider filter is safe.
  const current = paginate(filtered, page, STORE_PAGE_SIZE);

  // Any change to what is being listed starts again from page 1.
  const onSearch = (v: string) => { setSearch(v); setPage(1); };
  const onCategory = (c: Category | null) => { setActiveCategory(c); setPage(1); };
  const onSort = (s: SortOption) => { setSort(s); setPage(1); };

  const goTo = (n: number) => {
    setPage(n);
    // Back to the top of the grid, not the top of the page (the hero is tall).
    document.getElementById('products')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleReset = () => {
    setSearch('');
    setActiveCategory(null);
    setSort('featured');
    setPage(1);
  };

  const navBtn =
    'inline-flex items-center justify-center min-w-9 h-9 px-2 text-[11px] font-bold tracking-[0.1em] border transition-colors duration-200';

  return (
    <section id="products" className="bg-zinc-950 py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="sticky top-16 lg:top-20 z-30 bg-zinc-950/95 backdrop-blur-sm py-4 -mx-6 lg:-mx-8 px-6 lg:px-8 border-b border-zinc-900">
          <ProductFilters
            categories={categories}
            search={search}
            onSearchChange={onSearch}
            activeCategory={activeCategory}
            onCategoryChange={onCategory}
            sort={sort}
            onSortChange={onSort}
            resultCount={filtered.length}
          />
        </div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.length === 0 ? (
            <EmptyState
              variant="no-results"
              onReset={handleReset}
              searchTerm={search || undefined}
              activeCategory={activeCategory}
            />
          ) : (
            current.items.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                effectiveRating={ratings?.[product.id]?.rating}
                effectiveCount={ratings?.[product.id]?.count}
              />
            ))
          )}
        </div>

        {current.totalPages > 1 && (
          <nav aria-label="Product pages" className="mt-10 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => goTo(current.page - 1)}
              disabled={current.page === 1}
              aria-label="Previous page"
              className={`${navBtn} border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed`}
            >
              <ChevronLeft size={14} aria-hidden="true" />
            </button>
            {pageWindow(current.page, current.totalPages).map((n, i) =>
              n === null ? (
                <span key={`gap-${i}`} className="px-1 text-zinc-600 text-xs" aria-hidden="true">
                  …
                </span>
              ) : (
                <button
                  key={n}
                  type="button"
                  onClick={() => goTo(n)}
                  aria-current={n === current.page ? 'page' : undefined}
                  className={`${navBtn} ${
                    n === current.page
                      ? 'border-cyan-400/50 bg-cyan-400/10 text-cyan-400'
                      : 'border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'
                  }`}
                >
                  {n}
                </button>
              )
            )}
            <button
              type="button"
              onClick={() => goTo(current.page + 1)}
              disabled={current.page === current.totalPages}
              aria-label="Next page"
              className={`${navBtn} border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed`}
            >
              <ChevronRight size={14} aria-hidden="true" />
            </button>
          </nav>
        )}
      </div>
    </section>
  );
}
