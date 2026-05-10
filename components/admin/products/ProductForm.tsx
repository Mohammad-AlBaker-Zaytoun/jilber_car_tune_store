'use client';

import { useState, useEffect, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import type { Product } from '@/data/products';
import { CATEGORIES } from '@/data/products';

type FormProduct = Omit<Product, 'id'>;

const EMPTY: FormProduct = {
  slug: '',
  name: '',
  category: 'ECU Tuning',
  shortDescription: '',
  description: '',
  price: 0,
  oldPrice: undefined,
  currency: 'USD',
  badge: undefined,
  rating: 5.0,
  reviewCount: 0,
  inStock: true,
  featured: false,
  visualColor: '#00d4ff',
  visualColor2: '#003d99',
  specs: [],
  compatibility: [],
  includedItems: [],
};

interface Props {
  initial?: Product;
  mode: 'new' | 'edit';
}

const inputCls =
  'w-full bg-zinc-900 border border-zinc-800 focus:border-cyan-400/50 text-zinc-100 text-sm px-4 py-3 outline-none transition-colors duration-200 placeholder:text-zinc-600';
const labelCls = 'block text-[10px] text-zinc-500 tracking-[0.2em] uppercase font-bold mb-1.5';
const sectionCls = 'border border-zinc-800/50 bg-zinc-900/20 p-6';

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <label className={labelCls}>
        {label}
        {required && <span className="text-cyan-400 ml-1">*</span>}
      </label>
      {children}
      {error && <p className="text-red-400 text-[10px] mt-1">{error}</p>}
    </div>
  );
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export default function ProductForm({ initial, mode }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormProduct>(initial ?? EMPTY);
  const [slugManual, setSlugManual] = useState(mode === 'edit');
  const [errors, setErrors] = useState<Partial<Record<keyof FormProduct, string>>>({});
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Auto-generate slug from name
  useEffect(() => {
    if (!slugManual && mode === 'new') {
      setForm((prev) => ({ ...prev, slug: slugify(prev.name) }));
    }
  }, [form.name, slugManual, mode]);

  const set = (key: keyof FormProduct) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox'
      ? (e.target as HTMLInputElement).checked
      : e.target.type === 'number'
      ? parseFloat(e.target.value) || 0
      : e.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const errs: typeof errors = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.slug.trim()) errs.slug = 'Slug is required';
    if (!/^[a-z0-9-]+$/.test(form.slug)) errs.slug = 'Slug: lowercase letters, numbers, hyphens only';
    if (!form.shortDescription.trim()) errs.shortDescription = 'Short description is required';
    if (!form.description.trim()) errs.description = 'Description is required';
    if (!form.price || form.price <= 0) errs.price = 'Price must be a positive number';
    if (form.oldPrice !== undefined && form.oldPrice !== null && form.oldPrice <= 0) {
      errs.oldPrice = 'Old price must be positive';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // --- Array field helpers ---
  const addSpec = () => setForm((p) => ({ ...p, specs: [...p.specs, { label: '', value: '' }] }));
  const removeSpec = (i: number) =>
    setForm((p) => ({ ...p, specs: p.specs.filter((_, idx) => idx !== i) }));
  const updateSpec = (i: number, field: 'label' | 'value', val: string) =>
    setForm((p) => {
      const specs = [...p.specs];
      specs[i] = { ...specs[i], [field]: val };
      return { ...p, specs };
    });

  const addString = (key: 'compatibility' | 'includedItems') =>
    setForm((p) => ({ ...p, [key]: [...p[key], ''] }));
  const removeString = (key: 'compatibility' | 'includedItems', i: number) =>
    setForm((p) => ({ ...p, [key]: p[key].filter((_, idx) => idx !== i) }));
  const updateString = (key: 'compatibility' | 'includedItems', i: number, val: string) =>
    setForm((p) => {
      const arr = [...p[key]];
      arr[i] = val;
      return { ...p, [key]: arr };
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;
    setSubmitting(true);

    const payload = {
      ...form,
      oldPrice: form.oldPrice || undefined,
      badge: form.badge || undefined,
    };

    try {
      const url = mode === 'edit' ? `/api/admin/products/${initial!.slug}` : '/api/admin/products';
      const method = mode === 'edit' ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setServerError(data.error ?? 'Something went wrong. Please try again.');
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push('/admin/products'), 1200);
    } catch {
      setServerError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center text-center gap-4 py-16">
        <div className="w-14 h-14 flex items-center justify-center border border-cyan-400/30 bg-cyan-400/5">
          <CheckCircle size={28} className="text-cyan-400" aria-hidden="true" />
        </div>
        <h2 className="text-xl font-black text-white">
          {mode === 'edit' ? 'Product Updated' : 'Product Created'}
        </h2>
        <p className="text-sm text-zinc-500">Redirecting to products list…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6 max-w-4xl">
      {serverError && (
        <div className="flex items-center gap-2.5 p-4 border border-red-500/30 bg-red-500/5 text-red-400 text-xs">
          <AlertCircle size={14} className="shrink-0" aria-hidden="true" />
          {serverError}
        </div>
      )}

      {/* Basic info */}
      <div className={sectionCls}>
        <h3 className="text-[10px] font-black text-white tracking-[0.25em] uppercase mb-5">
          Basic Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Product Name" required error={errors.name}>
            <input type="text" value={form.name} onChange={set('name')} className={inputCls} placeholder="Stage 1 ECU Tune" />
          </Field>

          <Field label="Slug" required error={errors.slug}>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => { setSlugManual(true); set('slug')(e); }}
              className={inputCls}
              placeholder="stage-1-ecu-tune"
            />
          </Field>

          <Field label="Category" required>
            <select value={form.category} onChange={set('category')} className={inputCls}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>

          <Field label="Badge (optional)">
            <input type="text" value={form.badge ?? ''} onChange={set('badge')} className={inputCls} placeholder="Best Seller" />
          </Field>

          <div className="sm:col-span-2">
            <Field label="Short Description" required error={errors.shortDescription}>
              <input type="text" value={form.shortDescription} onChange={set('shortDescription')} className={inputCls} placeholder="One-line summary shown on product cards" />
            </Field>
          </div>

          <div className="sm:col-span-2">
            <Field label="Full Description" required error={errors.description}>
              <textarea rows={6} value={form.description} onChange={set('description')} className={`${inputCls} resize-y`} placeholder="Detailed description shown on product detail page" />
            </Field>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className={sectionCls}>
        <h3 className="text-[10px] font-black text-white tracking-[0.25em] uppercase mb-5">Pricing</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Price" required error={errors.price}>
            <input type="number" min={0} step={0.01} value={form.price} onChange={set('price')} className={inputCls} placeholder="499" />
          </Field>
          <Field label="Old Price (optional)" error={errors.oldPrice}>
            <input type="number" min={0} step={0.01} value={form.oldPrice ?? ''} onChange={set('oldPrice')} className={inputCls} placeholder="599" />
          </Field>
          <Field label="Currency">
            <input type="text" value={form.currency} onChange={set('currency')} className={inputCls} placeholder="USD" />
          </Field>
        </div>
      </div>

      {/* Status & appearance */}
      <div className={sectionCls}>
        <h3 className="text-[10px] font-black text-white tracking-[0.25em] uppercase mb-5">Status & Appearance</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" checked={form.inStock} onChange={set('inStock')} className="w-4 h-4 accent-cyan-400 cursor-pointer" />
              <span className="text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors font-semibold">In Stock</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" checked={form.featured} onChange={set('featured')} className="w-4 h-4 accent-cyan-400 cursor-pointer" />
              <span className="text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors font-semibold">Featured</span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Rating (0–5)">
              <input type="number" min={0} max={5} step={0.1} value={form.rating} onChange={set('rating')} className={inputCls} />
            </Field>
            <Field label="Review Count">
              <input type="number" min={0} step={1} value={form.reviewCount} onChange={set('reviewCount')} className={inputCls} />
            </Field>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <Field label="Visual Color 1 (hex)">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.visualColor}
                onChange={set('visualColor')}
                className="w-10 h-10 border border-zinc-800 bg-zinc-900 cursor-pointer p-1"
                aria-label="Visual color 1"
              />
              <input type="text" value={form.visualColor} onChange={set('visualColor')} className={`${inputCls} flex-1`} />
            </div>
          </Field>
          <Field label="Visual Color 2 (hex)">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.visualColor2}
                onChange={set('visualColor2')}
                className="w-10 h-10 border border-zinc-800 bg-zinc-900 cursor-pointer p-1"
                aria-label="Visual color 2"
              />
              <input type="text" value={form.visualColor2} onChange={set('visualColor2')} className={`${inputCls} flex-1`} />
            </div>
          </Field>
        </div>
      </div>

      {/* Specs */}
      <div className={sectionCls}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[10px] font-black text-white tracking-[0.25em] uppercase">
            Specifications
          </h3>
          <button type="button" onClick={addSpec} className="inline-flex items-center gap-1.5 text-[10px] text-cyan-400 hover:text-cyan-300 font-bold tracking-widest uppercase transition-colors">
            <Plus size={11} aria-hidden="true" /> Add
          </button>
        </div>
        {form.specs.length === 0 && (
          <p className="text-xs text-zinc-600 mb-3">No specs added yet.</p>
        )}
        <div className="flex flex-col gap-2">
          {form.specs.map((spec, i) => (
            <div key={i} className="flex items-center gap-2">
              <input value={spec.label} onChange={(e) => updateSpec(i, 'label', e.target.value)} className={`${inputCls} flex-1`} placeholder="Label" />
              <input value={spec.value} onChange={(e) => updateSpec(i, 'value', e.target.value)} className={`${inputCls} flex-1`} placeholder="Value" />
              <button type="button" onClick={() => removeSpec(i)} className="text-zinc-600 hover:text-red-400 transition-colors p-2 shrink-0" aria-label="Remove spec">
                <Trash2 size={13} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Compatibility */}
      <div className={sectionCls}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[10px] font-black text-white tracking-[0.25em] uppercase">Compatibility</h3>
          <button type="button" onClick={() => addString('compatibility')} className="inline-flex items-center gap-1.5 text-[10px] text-cyan-400 hover:text-cyan-300 font-bold tracking-widest uppercase transition-colors">
            <Plus size={11} aria-hidden="true" /> Add
          </button>
        </div>
        {form.compatibility.length === 0 && (
          <p className="text-xs text-zinc-600 mb-3">No compatibility entries added.</p>
        )}
        <div className="flex flex-col gap-2">
          {form.compatibility.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <input value={item} onChange={(e) => updateString('compatibility', i, e.target.value)} className={`${inputCls} flex-1`} placeholder="e.g. BMW M3/M4 (G80/G82)" />
              <button type="button" onClick={() => removeString('compatibility', i)} className="text-zinc-600 hover:text-red-400 transition-colors p-2 shrink-0" aria-label="Remove">
                <Trash2 size={13} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Included Items */}
      <div className={sectionCls}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[10px] font-black text-white tracking-[0.25em] uppercase">Included Items</h3>
          <button type="button" onClick={() => addString('includedItems')} className="inline-flex items-center gap-1.5 text-[10px] text-cyan-400 hover:text-cyan-300 font-bold tracking-widest uppercase transition-colors">
            <Plus size={11} aria-hidden="true" /> Add
          </button>
        </div>
        {form.includedItems.length === 0 && (
          <p className="text-xs text-zinc-600 mb-3">No included items added.</p>
        )}
        <div className="flex flex-col gap-2">
          {form.includedItems.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <input value={item} onChange={(e) => updateString('includedItems', i, e.target.value)} className={`${inputCls} flex-1`} placeholder="e.g. Custom ECU remap file" />
              <button type="button" onClick={() => removeString('includedItems', i)} className="text-zinc-600 hover:text-red-400 transition-colors p-2 shrink-0" aria-label="Remove">
                <Trash2 size={13} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={submitting}
          className="px-8 py-3.5 bg-cyan-400 hover:bg-cyan-300 text-black font-black text-xs tracking-[0.25em] uppercase transition-all duration-200 hover:shadow-[0_0_24px_rgba(0,212,255,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Saving…' : mode === 'edit' ? 'Save Changes' : 'Create Product'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/products')}
          disabled={submitting}
          className="px-6 py-3.5 border border-zinc-700 hover:border-zinc-600 text-zinc-400 hover:text-zinc-200 font-black text-xs tracking-[0.25em] uppercase transition-all duration-200"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
