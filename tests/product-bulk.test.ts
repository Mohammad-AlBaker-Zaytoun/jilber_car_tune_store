import { describe, it, expect } from 'vitest';
import { chunk, MAX_BULK_DELETE } from '@/lib/product-bulk';

describe('chunk', () => {
  it('splits an oversized selection into batches the API will accept', () => {
    // "Select all" on the live catalogue is ~1,900 products.
    const slugs = Array.from({ length: 1901 }, (_, i) => `product-${i}`);
    const batches = chunk(slugs, MAX_BULK_DELETE);

    expect(batches).toHaveLength(Math.ceil(1901 / MAX_BULK_DELETE));
    expect(batches.every((b) => b.length <= MAX_BULK_DELETE)).toBe(true);
    expect(batches.flat()).toEqual(slugs);
  });

  it('returns a single batch when the selection already fits', () => {
    const slugs = ['a', 'b', 'c'];
    expect(chunk(slugs, MAX_BULK_DELETE)).toEqual([slugs]);
  });

  it('handles an empty selection without producing an empty request', () => {
    expect(chunk([], MAX_BULK_DELETE)).toEqual([]);
  });

  it('splits exactly on the boundary, with no trailing empty batch', () => {
    const slugs = Array.from({ length: MAX_BULK_DELETE * 2 }, (_, i) => String(i));
    const batches = chunk(slugs, MAX_BULK_DELETE);
    expect(batches).toHaveLength(2);
    expect(batches[0]).toHaveLength(MAX_BULK_DELETE);
    expect(batches[1]).toHaveLength(MAX_BULK_DELETE);
  });

  it('loses nothing and reorders nothing', () => {
    const slugs = Array.from({ length: 57 }, (_, i) => `s${i}`);
    expect(chunk(slugs, 10).flat()).toEqual(slugs);
  });

  it('refuses a nonsensical size rather than looping forever', () => {
    expect(() => chunk(['a'], 0)).toThrow();
  });

  it('stays within the limit the API enforces', () => {
    // The route rejects anything above MAX_BULK_DELETE, so the client's default
    // batch size must not exceed it.
    expect(chunk(Array.from({ length: 500 }, (_, i) => String(i)))[0].length).toBeLessThanOrEqual(
      MAX_BULK_DELETE
    );
  });
});
