import { describe, it, expect } from 'vitest';
import { chunk, pageBounds, MAX_BULK_DELETE } from '@/lib/product-bulk';

describe('pageBounds', () => {
  it('counts pages over the live catalogue size', () => {
    expect(pageBounds(1901, 0, 50).pageCount).toBe(39);
  });

  it('leaves a page that is already in range alone', () => {
    expect(pageBounds(1901, 7, 50)).toEqual({ pageCount: 39, page: 7 });
  });

  /** The reason this is clamped: bulk-deleting the tail shortens the list. */
  it('pulls a page back when the list shrinks beneath it', () => {
    expect(pageBounds(1901, 38, 50).page).toBe(38);
    // The admin deletes the last 1,800, standing on page 38.
    expect(pageBounds(101, 38, 50)).toEqual({ pageCount: 3, page: 2 });
  });

  it('reports one page for an empty list rather than zero', () => {
    expect(pageBounds(0, 0, 50)).toEqual({ pageCount: 1, page: 0 });
    expect(pageBounds(0, 12, 50)).toEqual({ pageCount: 1, page: 0 });
  });

  it('does not return a negative page', () => {
    expect(pageBounds(120, -3, 50).page).toBe(0);
  });

  it('does not add an empty trailing page on an exact multiple', () => {
    expect(pageBounds(100, 0, 50).pageCount).toBe(2);
  });

  it('refuses a nonsensical size', () => {
    expect(() => pageBounds(10, 0, 0)).toThrow();
  });
});

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
