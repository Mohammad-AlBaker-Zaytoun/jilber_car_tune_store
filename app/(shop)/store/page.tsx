'use client';

import { useState, useMemo } from 'react';
import { products } from '@/data/products';
import type { Category } from '@/data/products';
import StoreHero from '@/components/store/StoreHero';
import ProductFilters from '@/components/store/ProductFilters';
import type { SortOption } from '@/components/store/ProductFilters';
import ProductCard from '@/components/store/ProductCard';
import EmptyState from '@/components/store/EmptyState';

export default function StorePage() {
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
          case 'rating':
            return b.rating - a.rating;
          default:
            return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
        }
      });
  }, [search, activeCategory, sort]);

  const handleReset = () => {
    setSearch('');
    setActiveCategory(null);
    setSort('featured');
  };

  return (
    <>
      <StoreHero />

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
                <ProductCard key={product.id} product={product} />
              ))
            )}
          </div>
        </div>
      </section>
    </>
  );
}
