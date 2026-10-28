import { describe, it, expect } from 'vitest';
import { compareProducts } from '@/lib/product-sort';
import type { Product } from '@/data/products';

function p(over: Partial<Product> & { id: string }): Product {
  // slug/name default to the id for readable failure output; `over` is spread
  // last so any explicit value wins, and it already carries `id`.
  return {
    slug: over.id,
    name: over.id,
    category: 'INTERNALS',
    shortDescription: '',
    description: '',
    price: 100,
    currency: 'USD',
    rating: 0,
    reviewCount: 0,
    inStock: true,
    featured: false,
    visualColor: '#000',
    visualColor2: '#000',
    specs: [],
    compatibility: [],
    includedItems: [],
    images: [],
    ...over,
  } as Product;
}

const order = (list: Product[], ...args: Parameters<typeof compareProducts>) =>
  [...list].sort(compareProducts(...args)).map((x) => x.id);

describe('compareProducts', () => {
  it('sinks out-of-stock products below in-stock ones', () => {
    const list = [
      p({ id: 'gone-a', inStock: false }),
      p({ id: 'here-a' }),
      p({ id: 'gone-b', inStock: false }),
      p({ id: 'here-b' }),
    ];
    expect(order(list, 'featured')).toEqual(['here-a', 'here-b', 'gone-a', 'gone-b']);
  });

  /**
   * The point of the rule: availability outranks the customer's chosen sort.
   * A cheap unavailable part must not outrank a slightly dearer one they can buy.
   */
  it('keeps availability above price, in both directions', () => {
    const list = [
      p({ id: 'cheap-gone', price: 5, inStock: false }),
      p({ id: 'dear-here', price: 900 }),
      p({ id: 'cheap-here', price: 10 }),
      p({ id: 'dear-gone', price: 999, inStock: false }),
    ];
    expect(order(list, 'price-asc')).toEqual(['cheap-here', 'dear-here', 'cheap-gone', 'dear-gone']);
    expect(order(list, 'price-desc')).toEqual(['dear-here', 'cheap-here', 'dear-gone', 'cheap-gone']);
  });

  it('keeps availability above featured', () => {
    const list = [
      p({ id: 'featured-gone', featured: true, inStock: false }),
      p({ id: 'plain-here' }),
    ];
    expect(order(list, 'featured')).toEqual(['plain-here', 'featured-gone']);
  });

  it('keeps availability above rating, and prefers the effective rating', () => {
    const list = [
      p({ id: 'top-gone', rating: 5, inStock: false }),
      p({ id: 'ok-here', rating: 2 }),
      p({ id: 'good-here', rating: 1 }),
    ];
    // good-here's stored rating is 1, but customers actually rated it 4.9
    const ratings = { 'good-here': { rating: 4.9, count: 12 } };
    expect(order(list, 'rating', ratings)).toEqual(['good-here', 'ok-here', 'top-gone']);
  });

  it('still applies the chosen sort within each availability group', () => {
    const list = [
      p({ id: 'gone-cheap', price: 1, inStock: false }),
      p({ id: 'gone-dear', price: 500, inStock: false }),
      p({ id: 'here-dear', price: 400 }),
      p({ id: 'here-cheap', price: 3 }),
    ];
    expect(order(list, 'price-asc')).toEqual(['here-cheap', 'here-dear', 'gone-cheap', 'gone-dear']);
  });

  it('is stable for ties, so the grid does not shuffle between renders', () => {
    const list = [p({ id: 'a' }), p({ id: 'b' }), p({ id: 'c' })];
    expect(order(list, 'featured')).toEqual(['a', 'b', 'c']);
    expect(order(list, 'price-asc')).toEqual(['a', 'b', 'c']);
  });

  it('handles an all-out-of-stock list without crashing', () => {
    const list = [
      p({ id: 'x', price: 20, inStock: false }),
      p({ id: 'y', price: 10, inStock: false }),
    ];
    expect(order(list, 'price-asc')).toEqual(['y', 'x']);
  });
});
