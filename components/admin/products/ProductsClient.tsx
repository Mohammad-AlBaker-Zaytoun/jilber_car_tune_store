'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Search, Pencil, Trash2, Star, Package, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import type { Product } from '@/data/products';
import { formatMoneyCompact, formatNumber } from '@/lib/currency';


async function fetchProducts(): Promise<Product[]> {
  const r = await fetch('/api/admin/products');
  return (await r.json()) as Product[];
}

const thCls =
  'text-left px-4 py-3 text-[9px] text-zinc-600 tracking-[0.2em] uppercase font-bold whitespace-nowrap';

/** Hit area for the icon toggles: 28px clears the 24px WCAG 2.2 AA floor. */
const iconBtnCls =
  'inline-flex items-center justify-center w-7 h-7 transition-colors border border-transparent hover:border-zinc-700';

const PRODUCT_COLUMNS = ['Category', 'Price', 'Stock', 'Featured', 'Rating', 'Actions'] as const;
type ProductColumn = (typeof PRODUCT_COLUMNS)[number];

/** The product's image and name — the row heading in both layouts. */
function ProductIdentity({ product: p }: { product: Product }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div
        className="relative w-9 h-9 shrink-0 border border-zinc-800 overflow-hidden"
        style={
          p.images?.[0]
            ? undefined
            : { background: `linear-gradient(135deg, ${p.visualColor}22, ${p.visualColor2}22)` }
        }
        aria-hidden="true"
      >
        {p.images?.[0] ? (
          <Image src={p.images[0]} alt="" fill sizes="36px" className="object-cover" />
        ) : null}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-black text-zinc-200 wrap-anywhere">{p.name}</p>
        <p className="text-[10px] text-zinc-600 wrap-anywhere">{p.slug}</p>
      </div>
    </div>
  );
}

/**
 * A row's cells, defined once for the table and the card list.
 *
 * Typed as a complete Record over PRODUCT_COLUMNS, so a new column without a cell
 * is a type error rather than a gap at one breakpoint.
 */
function productCells(
  p: Product,
  toggleStock: (p: Product) => void,
  toggleFeatured: (p: Product) => void,
  setToDelete: (p: Product) => void
): Record<ProductColumn, React.ReactNode> {
  return {
    Category: <span className="text-[10px] text-zinc-500 font-semibold">{p.category}</span>,
    Price: (
      <div>
        <span className="text-xs font-black text-zinc-200">{formatMoneyCompact(p.price)}</span>
        {p.oldPrice && (
          <span className="text-[10px] text-zinc-600 line-through ml-1.5">
            {formatMoneyCompact(p.oldPrice)}
          </span>
        )}
      </div>
    ),
    Stock: (
      <button
        onClick={() => toggleStock(p)}
        className={iconBtnCls}
        aria-label={p.inStock ? `Mark ${p.name} out of stock` : `Mark ${p.name} in stock`}
      >
        {p.inStock ? (
          <CheckCircle size={15} className="text-emerald-400 hover:text-emerald-300" aria-hidden="true" />
        ) : (
          <XCircle size={15} className="text-red-400 hover:text-red-300" aria-hidden="true" />
        )}
      </button>
    ),
    Featured: (
      <button
        onClick={() => toggleFeatured(p)}
        className={iconBtnCls}
        aria-label={p.featured ? `Unfeature ${p.name}` : `Feature ${p.name}`}
      >
        <Star
          size={15}
          className={
            p.featured
              ? 'text-yellow-400 hover:text-yellow-300 fill-yellow-400'
              : 'text-zinc-700 hover:text-zinc-500'
          }
          aria-hidden="true"
        />
      </button>
    ),
    Rating:
      p.rating > 0 && p.reviewCount > 0 ? (
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-black text-amber-400">★ {p.rating}</span>
          <span className="text-[10px] text-zinc-600">{formatNumber(p.reviewCount)} reviews</span>
        </div>
      ) : (
        <span className="text-[10px] text-zinc-700 italic">No reviews</span>
      ),
    Actions: (
      <div className="flex items-center gap-2">
        <Link
          href={`/admin/products/${p.slug}/edit`}
          className={`${iconBtnCls} text-zinc-600 hover:text-cyan-400`}
          aria-label={`Edit ${p.name}`}
        >
          <Pencil size={13} aria-hidden="true" />
        </Link>
        <button
          onClick={() => setToDelete(p)}
          className={`${iconBtnCls} text-zinc-600 hover:text-red-400`}
          aria-label={`Delete ${p.name}`}
        >
          <Trash2 size={13} aria-hidden="true" />
        </button>
      </div>
    ),
  };
}

export default function ProductsClient({ categories }: { categories: string[] }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterStock, setFilterStock] = useState('');
  const [toDelete, setToDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toggleError, setToggleError] = useState('');

  const load = () => {
    setLoading(true);
    fetchProducts()
      .then((data) => setProducts(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProducts()
      .then((data) => setProducts(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products
      .filter((p) => !filterCat || p.category === filterCat)
      .filter((p) => {
        if (filterStock === 'in') return p.inStock;
        if (filterStock === 'out') return !p.inStock;
        return true;
      })
      .filter((p) => !q || p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
  }, [products, search, filterCat, filterStock]);

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await fetch(`/api/admin/products/${toDelete.slug}`, { method: 'DELETE' });
      setToDelete(null);
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const toggleFeatured = async (product: Product) => {
    setToggleError('');
    const res = await fetch(`/api/admin/products/${product.slug}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ featured: !product.featured }),
    });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setToggleError(data.error ?? 'Failed to update product.');
    }
    load();
  };

  const toggleStock = async (product: Product) => {
    setToggleError('');
    const res = await fetch(`/api/admin/products/${product.slug}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inStock: !product.inStock }),
    });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setToggleError(data.error ?? 'Failed to update product.');
    }
    load();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-xs text-zinc-600 tracking-widest uppercase animate-pulse">Loading…</p>
      </div>
    );
  }

  return (
    <>
      <ConfirmDialog
        open={!!toDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${toDelete?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />

      {toggleError && (
        <div className="flex items-center gap-2.5 mb-4 p-3 border border-red-500/30 bg-red-500/5 text-red-400 text-xs">
          <AlertCircle size={13} className="shrink-0" aria-hidden="true" />
          {toggleError}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            className="w-full bg-zinc-900 border border-zinc-800 focus:border-cyan-400/50 text-zinc-100 text-xs pl-9 pr-4 py-2.5 outline-none transition-colors placeholder:text-zinc-600"
          />
        </div>

        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 focus:border-cyan-400/50 text-zinc-400 text-xs px-3 py-2.5 outline-none transition-colors"
        >
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <select
          value={filterStock}
          onChange={(e) => setFilterStock(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 focus:border-cyan-400/50 text-zinc-400 text-xs px-3 py-2.5 outline-none transition-colors"
        >
          <option value="">All Stock</option>
          <option value="in">In Stock</option>
          <option value="out">Out of Stock</option>
        </select>

        <span className="text-[10px] text-zinc-600 ml-auto">{filtered.length} product{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="border border-zinc-800/50 bg-zinc-900/20 flex flex-col items-center justify-center py-16 gap-4">
          <Package size={32} className="text-zinc-700" aria-hidden="true" />
          <p className="text-xs text-zinc-600">No products found.</p>
          <Link href="/admin/products/new" className="inline-flex items-center gap-2 px-4 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-black text-xs font-black tracking-widest uppercase transition-all duration-200">
            <Plus size={11} aria-hidden="true" /> Add First Product
          </Link>
        </div>
      ) : (
        <>
          {/* Wide screens: a real table. */}
          <div className="hidden lg:block border border-zinc-800/50 bg-zinc-900/20 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800/50">
                  <th className={thCls}>Product</th>
                  {PRODUCT_COLUMNS.map((col) => (
                    <th key={col} className={thCls}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const cells = productCells(p, toggleStock, toggleFeatured, setToDelete);
                  return (
                    <tr
                      key={p.id}
                      className="border-b border-zinc-800/30 hover:bg-zinc-900/30 transition-colors"
                    >
                      <td className="px-4 py-3.5 align-top">
                        <ProductIdentity product={p} />
                      </td>
                      {PRODUCT_COLUMNS.map((col) => (
                        <td key={col} className="px-4 py-3.5 align-top">
                          {cells[col]}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Phones and tablets: one card per product. Stock and Featured were
              `hidden md:table-cell` — and those cells hold the only CONTROLS for
              toggling them, so the owner could not mark a part out of stock from a
              phone at all. */}
          <ul aria-label="Products" className="lg:hidden flex flex-col gap-3">
            {filtered.map((p) => {
              const cells = productCells(p, toggleStock, toggleFeatured, setToDelete);
              return (
                <li
                  key={p.id}
                  className="border border-zinc-800/50 bg-zinc-900/20 p-4 flex flex-col gap-3"
                >
                  <ProductIdentity product={p} />
                  <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 items-center">
                    {PRODUCT_COLUMNS.map((col) => (
                      <div key={col} className="contents">
                        <dt className="text-[9px] text-zinc-600 tracking-[0.15em] uppercase font-bold">
                          {col}
                        </dt>
                        <dd className="min-w-0">{cells[col]}</dd>
                      </div>
                    ))}
                  </dl>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </>
  );
}
