'use client';

import { useState, useEffect, type ChangeEvent } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import type { AdminSettings } from '@/types/admin';

const inputCls =
  'w-full bg-zinc-900 border border-zinc-800 focus:border-cyan-400/50 text-zinc-100 text-sm px-4 py-3 outline-none transition-colors duration-200 placeholder:text-zinc-600';
const labelCls = 'block text-[10px] text-zinc-500 tracking-[0.2em] uppercase font-bold mb-1.5';

export default function SettingsClient() {
  const [form, setForm] = useState<AdminSettings>({
    shopName: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    currency: 'USD',
    taxRate: 10,
    bookingMessage: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((data: AdminSettings) => setForm(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const set =
    (key: keyof AdminSettings) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
      setForm((prev) => ({ ...prev, [key]: value }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? 'Failed to save settings');
        return;
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="py-20 text-center text-xs text-zinc-600 animate-pulse">Loading…</div>;

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6 max-w-2xl">
      {error && (
        <div className="flex items-center gap-2.5 p-4 border border-red-500/30 bg-red-500/5 text-red-400 text-xs">
          <AlertCircle size={14} className="shrink-0" aria-hidden="true" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2.5 p-4 border border-emerald-500/30 bg-emerald-500/5 text-emerald-400 text-xs">
          <CheckCircle size={14} className="shrink-0" aria-hidden="true" />
          Settings saved successfully.
        </div>
      )}

      <div className="border border-zinc-800/50 bg-zinc-900/20 p-6">
        <h3 className="text-[10px] font-black text-white tracking-[0.25em] uppercase mb-5">Shop Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Shop Name</label>
            <input type="text" value={form.shopName} onChange={set('shopName')} className={inputCls} placeholder="JILBER Performance" />
          </div>
          <div>
            <label className={labelCls}>Contact Email</label>
            <input type="email" value={form.contactEmail} onChange={set('contactEmail')} className={inputCls} placeholder="info@jilber.com" />
          </div>
          <div>
            <label className={labelCls}>Contact Phone</label>
            <input type="tel" value={form.contactPhone} onChange={set('contactPhone')} className={inputCls} placeholder="+1 555 000 0000" />
          </div>
          <div>
            <label className={labelCls}>Currency</label>
            <input type="text" value={form.currency} onChange={set('currency')} className={inputCls} placeholder="USD" />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Address</label>
            <input type="text" value={form.address} onChange={set('address')} className={inputCls} placeholder="42 Performance Drive, CA" />
          </div>
        </div>
      </div>

      <div className="border border-zinc-800/50 bg-zinc-900/20 p-6">
        <h3 className="text-[10px] font-black text-white tracking-[0.25em] uppercase mb-5">Commerce</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Tax Rate (%)</label>
            <input type="number" min={0} max={100} step={0.1} value={form.taxRate} onChange={set('taxRate')} className={inputCls} />
          </div>
        </div>
      </div>

      <div className="border border-zinc-800/50 bg-zinc-900/20 p-6">
        <h3 className="text-[10px] font-black text-white tracking-[0.25em] uppercase mb-5">Booking</h3>
        <div>
          <label className={labelCls}>Booking Confirmation Message</label>
          <textarea
            rows={4}
            value={form.bookingMessage}
            onChange={set('bookingMessage')}
            className={`${inputCls} resize-y`}
            placeholder="Message shown to customers after booking"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="px-8 py-3.5 bg-cyan-400 hover:bg-cyan-300 text-black font-black text-xs tracking-[0.25em] uppercase transition-all duration-200 hover:shadow-[0_0_24px_rgba(0,212,255,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
        <p className="text-[10px] text-zinc-700">
          Dev-only. Not connected to production.
        </p>
      </div>
    </form>
  );
}
