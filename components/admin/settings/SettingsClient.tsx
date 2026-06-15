'use client';

import { useState, useEffect, type ChangeEvent } from 'react';
import { CheckCircle, AlertCircle, Phone, MessageCircle, MapPin, Clock, ExternalLink, Eye, EyeOff } from 'lucide-react';
import type { AdminSettings } from '@/types/admin';
import { buildWhatsAppUrl, buildTelUrl, normalizeWhatsAppNumber } from '@/lib/contact';

const inputCls =
  'w-full bg-zinc-900 border border-zinc-800 focus:border-cyan-400/50 text-zinc-100 text-sm px-4 py-3 outline-none transition-colors duration-200 placeholder:text-zinc-600';
const labelCls = 'block text-[10px] text-zinc-500 tracking-[0.2em] uppercase font-bold mb-1.5';

const EMPTY: AdminSettings = {
  shopName: '',
  contactEmail: '',
  contactPhone: '',
  address: '',
  currency: 'USD',
  taxRate: 10,
  bookingMessage: '',
  whatsappNumber: '',
  googleMapsUrl: '',
  workingHours: '',
  enableFloatingWhatsApp: true,
  enableFloatingCall: true,
  defaultWhatsAppMessage: '',
  quoteWhatsAppMessage: '',
  productWhatsAppMessage: '',
};

function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
        checked ? 'bg-cyan-400' : 'bg-zinc-700'
      }`}
      aria-label={label}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-[10px] text-zinc-600 leading-relaxed">{children}</p>;
}

export default function SettingsClient() {
  const [form, setForm] = useState<AdminSettings>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [waPreview, setWaPreview] = useState(false);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((data: AdminSettings) => setForm({ ...EMPTY, ...data }))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const set =
    (key: keyof AdminSettings) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
      setForm((prev) => ({ ...prev, [key]: value }));
    };

  const setToggle = (key: keyof AdminSettings) => (v: boolean) =>
    setForm((prev) => ({ ...prev, [key]: v }));

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

  const waDigits = normalizeWhatsAppNumber(form.whatsappNumber);
  const waTestUrl = buildWhatsAppUrl(form.whatsappNumber, form.defaultWhatsAppMessage || undefined);
  const telUrl = buildTelUrl(form.contactPhone);

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

      {/* ── Shop Information ── */}
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
            <input type="tel" value={form.contactPhone} onChange={set('contactPhone')} className={inputCls} placeholder="+961 70 123 456" />
            {telUrl && (
              <FieldHint>
                Tel link: <span className="text-zinc-400">{telUrl}</span>
              </FieldHint>
            )}
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

      {/* ── Commerce ── */}
      <div className="border border-zinc-800/50 bg-zinc-900/20 p-6">
        <h3 className="text-[10px] font-black text-white tracking-[0.25em] uppercase mb-5">Commerce</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Tax Rate (%)</label>
            <input type="number" min={0} max={100} step={0.1} value={form.taxRate} onChange={set('taxRate')} className={inputCls} />
          </div>
        </div>
      </div>

      {/* ── Booking ── */}
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

      {/* ── Contact & Conversion ── */}
      <div className="border border-zinc-800/50 bg-zinc-900/20 p-6">
        <div className="flex items-center gap-2.5 mb-6">
          <MessageCircle size={14} className="text-cyan-400" aria-hidden="true" />
          <h3 className="text-[10px] font-black text-white tracking-[0.25em] uppercase">Contact &amp; Conversion</h3>
        </div>

        <div className="flex flex-col gap-6">
          {/* WhatsApp number */}
          <div>
            <label className={labelCls}>
              <span className="flex items-center gap-1.5">
                <MessageCircle size={10} aria-hidden="true" />
                WhatsApp Number
              </span>
            </label>
            <input
              type="tel"
              value={form.whatsappNumber}
              onChange={set('whatsappNumber')}
              className={inputCls}
              placeholder="+961 70 123 456"
            />
            {waDigits ? (
              <FieldHint>
                Normalized for wa.me:{' '}
                <span className="text-zinc-400 font-mono">{waDigits}</span>
                {' — '}
                <button
                  type="button"
                  onClick={() => setWaPreview((p) => !p)}
                  className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  {waPreview ? <EyeOff size={9} /> : <Eye size={9} />}
                  {waPreview ? 'hide preview' : 'preview link'}
                </button>
                {waPreview && waTestUrl && (
                  <span className="block mt-1 text-zinc-500 break-all">{waTestUrl}</span>
                )}
              </FieldHint>
            ) : (
              form.whatsappNumber && (
                <p className="mt-1 text-[10px] text-red-400">No valid digits found — check the number.</p>
              )
            )}
          </div>

          {/* Google Maps URL */}
          <div>
            <label className={labelCls}>
              <span className="flex items-center gap-1.5">
                <MapPin size={10} aria-hidden="true" />
                Google Maps URL (optional)
              </span>
            </label>
            <input
              type="url"
              value={form.googleMapsUrl}
              onChange={set('googleMapsUrl')}
              className={inputCls}
              placeholder="https://maps.google.com/..."
            />
            <FieldHint>Shown as a &ldquo;Get Directions&rdquo; link on the contact page.</FieldHint>
          </div>

          {/* Working hours */}
          <div>
            <label className={labelCls}>
              <span className="flex items-center gap-1.5">
                <Clock size={10} aria-hidden="true" />
                Working Hours (optional)
              </span>
            </label>
            <input
              type="text"
              value={form.workingHours}
              onChange={set('workingHours')}
              className={inputCls}
              placeholder="Mon–Fri 8 am–7 pm · Sat 9 am–5 pm · Sun Closed"
            />
          </div>

          {/* Floating buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-zinc-800/50">
            <div className="flex items-center justify-between gap-4 p-4 border border-zinc-800/50 bg-zinc-900/30">
              <div>
                <p className="text-xs text-zinc-300 font-semibold">Floating WhatsApp Button</p>
                <p className="text-[10px] text-zinc-600 mt-0.5">Shows on all public pages.</p>
              </div>
              <ToggleSwitch
                checked={form.enableFloatingWhatsApp}
                onChange={setToggle('enableFloatingWhatsApp')}
                label="Enable floating WhatsApp button"
              />
            </div>
            <div className="flex items-center justify-between gap-4 p-4 border border-zinc-800/50 bg-zinc-900/30">
              <div>
                <p className="text-xs text-zinc-300 font-semibold">Floating Call Button</p>
                <p className="text-[10px] text-zinc-600 mt-0.5">Shows on all public pages.</p>
              </div>
              <ToggleSwitch
                checked={form.enableFloatingCall}
                onChange={setToggle('enableFloatingCall')}
                label="Enable floating call button"
              />
            </div>
          </div>

          {/* Message templates */}
          <div className="flex flex-col gap-4 pt-2 border-t border-zinc-800/50">
            <div>
              <label className={labelCls}>Default WhatsApp Message</label>
              <textarea
                rows={2}
                value={form.defaultWhatsAppMessage}
                onChange={set('defaultWhatsAppMessage')}
                className={`${inputCls} resize-y`}
                placeholder="Hello, I would like to get more information about your services."
              />
            </div>
            <div>
              <label className={labelCls}>Quote WhatsApp Message</label>
              <textarea
                rows={2}
                value={form.quoteWhatsAppMessage}
                onChange={set('quoteWhatsAppMessage')}
                className={`${inputCls} resize-y`}
                placeholder="Hello, I want to request a quote for my vehicle."
              />
            </div>
            <div>
              <label className={labelCls}>Product WhatsApp Message Template</label>
              <textarea
                rows={2}
                value={form.productWhatsAppMessage}
                onChange={set('productWhatsAppMessage')}
                className={`${inputCls} resize-y`}
                placeholder="Hello, I am interested in {productName}. Can you provide more details?"
              />
              <FieldHint>
                Use <span className="text-zinc-400 font-mono">{'{productName}'}</span>,{' '}
                <span className="text-zinc-400 font-mono">{'{productPrice}'}</span>,{' '}
                <span className="text-zinc-400 font-mono">{'{currency}'}</span> as placeholders.
              </FieldHint>
            </div>
          </div>

          {/* Live test row */}
          {(waTestUrl || telUrl) && (
            <div className="pt-2 border-t border-zinc-800/50 flex flex-wrap gap-3">
              <p className="w-full text-[10px] text-zinc-600 uppercase tracking-widest font-bold">Test links</p>
              {waTestUrl && (
                <a
                  href={waTestUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-zinc-700 hover:border-cyan-400/40 text-zinc-400 hover:text-cyan-400 text-[10px] font-bold tracking-wide uppercase transition-colors"
                >
                  <ExternalLink size={10} aria-hidden="true" />
                  Test WhatsApp
                </a>
              )}
              {telUrl && (
                <a
                  href={telUrl}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-zinc-700 hover:border-cyan-400/40 text-zinc-400 hover:text-cyan-400 text-[10px] font-bold tracking-wide uppercase transition-colors"
                >
                  <Phone size={10} aria-hidden="true" />
                  Test Call
                </a>
              )}
            </div>
          )}
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
        <p className="text-[10px] text-zinc-700">Dev-only. Not connected to production.</p>
      </div>
    </form>
  );
}
