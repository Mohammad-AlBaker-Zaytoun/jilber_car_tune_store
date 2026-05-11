'use client';

import { useState, useMemo } from 'react';
import type { Product } from '@/data/products';
import type { Category } from '@/data/products';
import ProductFilters from './ProductFilters';
import type { SortOption } from './ProductFilters';
import ProductCard from './ProductCard';
import EmptyState from './EmptyState';

interface Props {
  products: Product[];
  /** Map of productId → effective { rating, count } computed server-side. */
  ratings?: Record<string, { rating: number; count: number }>;
}

export default function StoreContent({ products, ratings }: Props) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [sort, setSort] = useState<SortOption>('featured');

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
      .sort((a, b) => {
        switch (sort) {
          case 'price-asc':
            return a.price - b.price;
          case 'price-desc':
            return b.price - a.price;
          case 'rating': {
            const aRating = ratings?.[a.id]?.rating ?? a.rating;
            const bRating = ratings?.[b.id]?.rating ?? b.rating;
            return bRating - aRating;
          }
          default:
            return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
        }
      });
  }, [products, search, activeCategory, sort, ratings]);

  const handleReset = () => {
    setSearch('');
    setActiveCategory(null);
    setSort('featured');
  };

  return (
    <section className="bg-zinc-950 py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="sticky top-16 lg:top-20 z-30 bg-zinc-950/95 backdrop-blur-sm py-4 -mx-6 lg:-mx-8 px-6 lg:px-8 border-b border-zinc-900">
          <ProductFilters
            search={search}
            onSearchChange={setSearch}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            sort={sort}
            onSortChange={setSort}
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
            filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                effectiveRating={ratings?.[product.id]?.rating}
                effectiveCount={ratings?.[product.id]?.count}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
}
