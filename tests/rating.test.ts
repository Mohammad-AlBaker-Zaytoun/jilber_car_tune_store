import { describe, it, expect } from 'vitest';
import { calculateAverageRating, getEffectiveRating, buildRatingsMap } from '@/lib/rating';

describe('calculateAverageRating', () => {
  it('returns 0 for no reviews', () => {
    expect(calculateAverageRating([])).toBe(0);
  });
  it('averages and rounds to 1 decimal', () => {
    expect(calculateAverageRating([{ rating: 5 }, { rating: 4 }, { rating: 4 }])).toBe(4.3);
  });
});

describe('getEffectiveRating', () => {
  const product = { rating: 4.5, reviewCount: 10 };

  it('prefers customer reviews when present', () => {
    const r = getEffectiveRating(product, [{ rating: 3 }, { rating: 5 }]);
    expect(r.source).toBe('customer');
    expect(r.rating).toBe(4);
    expect(r.reviewCount).toBe(2);
  });

  it('falls back to admin product rating', () => {
    const r = getEffectiveRating(product, []);
    expect(r.source).toBe('admin');
    expect(r.rating).toBe(4.5);
  });

  it('returns none when no data', () => {
    expect(getEffectiveRating({ rating: 0, reviewCount: 0 }, []).source).toBe('none');
  });
});

describe('buildRatingsMap', () => {
  it('maps productId to its effective rating', () => {
    const products = [
      { id: 'p1', rating: 0, reviewCount: 0 },
      { id: 'p2', rating: 4, reviewCount: 2 },
    ];
    const reviews = [{ productId: 'p1', rating: 5 }];
    const map = buildRatingsMap(products, reviews);
    expect(map.p1).toEqual({ rating: 5, count: 1 });
    expect(map.p2).toEqual({ rating: 4, count: 2 });
  });
});
