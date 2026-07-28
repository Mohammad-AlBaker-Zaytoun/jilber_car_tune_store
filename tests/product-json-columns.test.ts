import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * MSSQL has no array type, so specs/compatibility/includedItems/images are
 * stored as JSON strings. A bare JSON.parse in the row mapper meant ONE
 * malformed row — a bad import, a manual edit, a truncated write — threw and
 * took down the entire product listing rather than just that product.
 *
 * The mapper is not exported, so this exercises it through getProducts() with
 * the Prisma client mocked.
 */
const findMany = vi.fn();

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    product: {
      findMany: (...args: unknown[]) => findMany(...args),
    },
  },
}));

const row = (over: Record<string, unknown> = {}) => ({
  id: 'p1',
  slug: 'test-part',
  name: 'Test Part',
  category: 'Exhaust',
  shortDescription: 's',
  description: 'd',
  price: 100,
  oldPrice: null,
  currency: 'USD',
  badge: null,
  rating: 0,
  reviewCount: 0,
  inStock: true,
  featured: false,
  visualColor: '#000',
  visualColor2: '#111',
  specs: '[]',
  compatibility: '[]',
  includedItems: '[]',
  images: '[]',
  ...over,
});

describe('product JSON column parsing', () => {
  beforeEach(() => {
    findMany.mockReset();
  });

  it('parses well-formed JSON array columns', async () => {
    const { getProducts } = await import('@/lib/products');
    findMany.mockResolvedValue([
      row({ images: '["/a.jpg","/b.jpg"]', compatibility: '["BMW M3"]' }),
    ]);

    const [product] = await getProducts();
    expect(product.images).toEqual(['/a.jpg', '/b.jpg']);
    expect(product.compatibility).toEqual(['BMW M3']);
  });

  it('degrades a malformed column to [] instead of throwing', async () => {
    const { getProducts } = await import('@/lib/products');
    findMany.mockResolvedValue([row({ images: '{not valid json' })]);

    const products = await getProducts();
    expect(products).toHaveLength(1);
    expect(products[0].images).toEqual([]);
  });

  it('does not let one bad row take down the whole listing', async () => {
    const { getProducts } = await import('@/lib/products');
    findMany.mockResolvedValue([
      row({ id: 'ok-1', slug: 'ok-1' }),
      row({ id: 'bad', slug: 'bad', specs: 'TRUNCATED' }),
      row({ id: 'ok-2', slug: 'ok-2' }),
    ]);

    const products = await getProducts();
    expect(products.map((p) => p.slug)).toEqual(['ok-1', 'bad', 'ok-2']);
    expect(products[1].specs).toEqual([]);
  });

  it('rejects valid JSON that is not an array', async () => {
    const { getProducts } = await import('@/lib/products');
    findMany.mockResolvedValue([row({ compatibility: '{"a":1}' })]);

    const [product] = await getProducts();
    expect(product.compatibility).toEqual([]);
  });

  it('handles a JSON null without throwing', async () => {
    const { getProducts } = await import('@/lib/products');
    findMany.mockResolvedValue([row({ includedItems: 'null' })]);

    const [product] = await getProducts();
    expect(product.includedItems).toEqual([]);
  });
});
