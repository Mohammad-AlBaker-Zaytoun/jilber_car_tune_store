import { describe, expect, it } from 'vitest';
import { paginate, pageWindow } from '@/lib/pagination';
import { toListingProduct, LISTING_SHORT_DESCRIPTION_MAX } from '@/lib/product-listing';
import type { Product } from '@/data/products';

const nums = Array.from({ length: 50 }, (_, i) => i + 1);

describe('paginate', () => {
  it('slices the requested page', () => {
    const p = paginate(nums, 2, 24);
    expect(p.items[0]).toBe(25);
    expect(p.items).toHaveLength(24);
    expect(p.totalPages).toBe(3);
    expect(p.total).toBe(50);
  });
  it('clamps out-of-range and non-finite pages', () => {
    expect(paginate(nums, 99, 24).page).toBe(3);
    expect(paginate(nums, 99, 24).items).toEqual([49, 50]);
    expect(paginate(nums, 0, 24).page).toBe(1);
    expect(paginate(nums, Number.NaN, 24).page).toBe(1);
  });
  it('treats an empty list as one empty page', () => {
    expect(paginate([], 3)).toEqual({ items: [], page: 1, totalPages: 1, total: 0 });
  });
});

describe('pageWindow', () => {
  it('shows first, last and neighbours with gaps', () => {
    expect(pageWindow(7, 40)).toEqual([1, null, 6, 7, 8, null, 40]);
    expect(pageWindow(1, 3)).toEqual([1, 2, 3]);
    expect(pageWindow(1, 1)).toEqual([1]);
  });
});

describe('toListingProduct', () => {
  const full: Product = {
    id: 'p1', slug: 's', name: 'N', category: 'EXHAUST', shortDescription: 'x'.repeat(500),
    description: 'long', price: 10, currency: 'USD', rating: 0, reviewCount: 0, inStock: true,
    featured: false, images: ['/a.jpg', '/b.jpg'], visualColor: '#000', visualColor2: '#111',
    specs: [{ label: 'a', value: 'b' }], compatibility: ['x'], includedItems: ['y'],
  };
  it('drops heavy fields and keeps one image', () => {
    const l = toListingProduct(full) as Record<string, unknown>;
    expect(l.description).toBeUndefined();
    expect(l.specs).toBeUndefined();
    expect(l.images).toEqual(['/a.jpg']);
    expect((l.shortDescription as string).length).toBeLessThanOrEqual(LISTING_SHORT_DESCRIPTION_MAX);
  });
});
