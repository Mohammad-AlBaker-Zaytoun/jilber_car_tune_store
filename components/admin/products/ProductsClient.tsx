'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Plus, Search, Pencil, Trash2, Star, Package, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import type { Product } from '@/data/products';
import { CATEGORIES } from '@/data/products';

export default function ProductsClient() {
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
    fetch('/api/admin/products')
      .then((r) => r.json())
      .then((data: Product[]) => setProducts(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

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
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
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
        <div className="border border-zinc-800/50 bg-zinc-900/20 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800/50">
                <th className="text-left px-5 py-3 text-[9px] text-zinc-600 tracking-[0.2em] uppercase font-bold">Product</th>
                <th className="text-left px-4 py-3 text-[9px] text-zinc-600 tracking-[0.2em] uppercase font-bold hidden sm:table-cell">Category</th>
                <th className="text-left px-4 py-3 text-[9px] text-zinc-600 tracking-[0.2em] uppercase font-bold">Price</th>
                <th className="text-center px-4 py-3 text-[9px] text-zinc-600 tracking-[0.2em] uppercase font-bold hidden md:table-cell">Stock</th>
                <th className="text-center px-4 py-3 text-[9px] text-zinc-600 tracking-[0.2em] uppercase font-bold hidden md:table-cell">Featured</th>
                <th className="text-right px-5 py-3 text-[9px] text-zinc-600 tracking-[0.2em] uppercase font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-zinc-800/30 hover:bg-zinc-900/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-7 h-7 shrink-0 border border-zinc-800"
                        style={{ background: `linear-gradient(135deg, ${p.visualColor}22, ${p.visualColor2}22)` }}
                        aria-hidden="true"
                      />
                      <div>
                        <p className="text-xs font-black text-zinc-200">{p.name}</p>
                        <p className="text-[10px] text-zinc-600">{p.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 hidden sm:table-cell">
                    <span className="text-[10px] text-zinc-500 font-semibold">{p.category}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div>
                      <span className="text-xs font-black text-zinc-200">${p.price.toLocaleString()}</span>
                      {p.oldPrice && (
                        <span className="text-[10px] text-zinc-600 line-through ml-1.5">${p.oldPrice.toLocaleString()}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-center hidden md:table-cell">
                    <button onClick={() => toggleStock(p)} className="transition-colors" aria-label={p.inStock ? 'Mark out of stock' : 'Mark in stock'}>
                      {p.inStock
                        ? <CheckCircle size={15} className="text-emerald-400 hover:text-emerald-300 mx-auto" aria-hidden="true" />
                        : <XCircle size={15} className="text-red-400 hover:text-red-300 mx-auto" aria-hidden="true" />}
                    </button>
                  </td>
                  <td className="px-4 py-3.5 text-center hidden md:table-cell">
                    <button onClick={() => toggleFeatured(p)} className="transition-colors" aria-label={p.featured ? 'Unfeature' : 'Feature'}>
                      <Star
                        size={15}
                        className={`mx-auto ${p.featured ? 'text-yellow-400 hover:text-yellow-300 fill-yellow-400' : 'text-zinc-700 hover:text-zinc-500'}`}
                        aria-hidden="true"
                      />
                    </button>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/products/${p.slug}/edit`}
                        className="p-2 text-zinc-600 hover:text-cyan-400 transition-colors border border-transparent hover:border-zinc-700"
                        aria-label={`Edit ${p.name}`}
                      >
                        <Pencil size={13} aria-hidden="true" />
                      </Link>
                      <button
                        onClick={() => setToDelete(p)}
                        className="p-2 text-zinc-600 hover:text-red-400 transition-colors border border-transparent hover:border-zinc-700"
                        aria-label={`Delete ${p.name}`}
                      >
                        <Trash2 size={13} aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
