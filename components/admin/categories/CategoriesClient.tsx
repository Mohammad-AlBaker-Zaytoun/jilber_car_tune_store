'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Tag, Check, X } from 'lucide-react';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import type { StoredCategory } from '@/types/admin';

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
}

const inputCls = 'w-full bg-zinc-900 border border-zinc-800 focus:border-cyan-400/50 text-zinc-100 text-xs px-3 py-2 outline-none transition-colors placeholder:text-zinc-600';

export default function CategoriesClient() {
  const [cats, setCats] = useState<StoredCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<StoredCategory | null>(null);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [toDelete, setToDelete] = useState<StoredCategory | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetch('/api/admin/categories')
      .then((r) => r.json())
      .then((data: StoredCategory[]) => setCats(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    setError('');
    if (!newName.trim()) { setError('Name is required'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, slug: newSlug || slugify(newName), description: newDesc }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) { setError(data.error ?? 'Failed to create'); return; }
      setAdding(false); setNewName(''); setNewSlug(''); setNewDesc('');
      load();
    } catch { setError('Something went wrong'); }
    finally { setSaving(false); }
  };

  const startEdit = (cat: StoredCategory) => {
    setEditing(cat); setEditName(cat.name); setEditSlug(cat.slug); setEditDesc(cat.description ?? '');
    setError('');
  };

  const handleEdit = async () => {
    if (!editing) return;
    setError('');
    if (!editName.trim()) { setError('Name is required'); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/categories/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, slug: editSlug || slugify(editName), description: editDesc }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) { setError(data.error ?? 'Failed to update'); return; }
      setEditing(null);
      load();
    } catch { setError('Something went wrong'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/categories/${toDelete.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? 'Failed to delete category.');
        setToDelete(null);
        return;
      }
      setToDelete(null);
      load();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <div className="py-20 text-center text-xs text-zinc-600 animate-pulse">Loading…</div>;

  return (
    <>
      <ConfirmDialog
        open={!!toDelete}
        title="Delete Category"
        message={`Delete "${toDelete?.name}"? Products using this category may be affected.`}
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />

      <div className="flex items-center justify-between mb-6">
        <span className="text-[10px] text-zinc-600">{cats.length} categor{cats.length !== 1 ? 'ies' : 'y'}</span>
        {!adding && (
          <button
            onClick={() => { setAdding(true); setError(''); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-black text-xs font-black tracking-widest uppercase transition-all duration-200"
          >
            <Plus size={11} aria-hidden="true" /> Add Category
          </button>
        )}
      </div>

      {error && <p className="text-red-400 text-xs mb-4">{error}</p>}

      {/* Add form */}
      {adding && (
        <div className="border border-cyan-400/20 bg-cyan-400/5 p-5 mb-4 flex flex-col gap-3">
          <p className="text-[10px] font-black text-cyan-400 tracking-widest uppercase">New Category</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={newName} onChange={(e) => { setNewName(e.target.value); setNewSlug(slugify(e.target.value)); }} className={inputCls} placeholder="Name *" />
            <input value={newSlug} onChange={(e) => setNewSlug(e.target.value)} className={inputCls} placeholder="Slug" />
            <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className={`${inputCls} sm:col-span-2`} placeholder="Description (optional)" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={saving} className="inline-flex items-center gap-1.5 px-4 py-2 bg-cyan-400 hover:bg-cyan-300 text-black text-xs font-black tracking-widest uppercase disabled:opacity-50">
              <Check size={11} aria-hidden="true" /> {saving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={() => { setAdding(false); setError(''); }} className="inline-flex items-center gap-1.5 px-4 py-2 border border-zinc-700 text-zinc-400 text-xs font-black tracking-widest uppercase">
              <X size={11} aria-hidden="true" /> Cancel
            </button>
          </div>
        </div>
      )}

      {cats.length === 0 ? (
        <div className="border border-zinc-800/50 bg-zinc-900/20 flex flex-col items-center py-16 gap-4">
          <Tag size={32} className="text-zinc-700" aria-hidden="true" />
          <p className="text-xs text-zinc-600">No categories yet.</p>
        </div>
      ) : (
        <div className="border border-zinc-800/50 bg-zinc-900/20">
          {cats.map((cat) => (
            <div key={cat.id} className="border-b border-zinc-800/30 last:border-0">
              {editing?.id === cat.id ? (
                <div className="p-5 flex flex-col gap-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input value={editName} onChange={(e) => setEditName(e.target.value)} className={inputCls} placeholder="Name *" />
                    <input value={editSlug} onChange={(e) => setEditSlug(e.target.value)} className={inputCls} placeholder="Slug" />
                    <input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className={`${inputCls} sm:col-span-2`} placeholder="Description (optional)" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleEdit} disabled={saving} className="inline-flex items-center gap-1.5 px-4 py-2 bg-cyan-400 hover:bg-cyan-300 text-black text-xs font-black tracking-widest uppercase disabled:opacity-50">
                      <Check size={11} aria-hidden="true" /> {saving ? 'Saving…' : 'Save'}
                    </button>
                    <button onClick={() => { setEditing(null); setError(''); }} className="inline-flex items-center gap-1.5 px-4 py-2 border border-zinc-700 text-zinc-400 text-xs font-black tracking-widest uppercase">
                      <X size={11} aria-hidden="true" /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between px-5 py-4 hover:bg-zinc-900/30 transition-colors">
                  <div>
                    <p className="text-xs font-black text-zinc-200">{cat.name}</p>
                    <p className="text-[10px] text-zinc-600 mt-0.5">{cat.slug}{cat.description ? ` — ${cat.description}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => startEdit(cat)} className="p-2 text-zinc-600 hover:text-cyan-400 transition-colors" aria-label={`Edit ${cat.name}`}>
                      <Pencil size={13} aria-hidden="true" />
                    </button>
                    <button onClick={() => setToDelete(cat)} className="p-2 text-zinc-600 hover:text-red-400 transition-colors" aria-label={`Delete ${cat.name}`}>
                      <Trash2 size={13} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
