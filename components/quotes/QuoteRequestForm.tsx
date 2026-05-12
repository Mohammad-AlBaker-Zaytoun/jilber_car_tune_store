'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Car, Wrench, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';
import { SERVICE_CATEGORIES } from '@/types/quotes';
import type { SessionUser } from '@/lib/auth';

interface Props {
  session: SessionUser | null;
  prefillProductSlug?: string;
  prefillProductName?: string;
}

const inputCls =
  'w-full bg-zinc-900 border border-zinc-800 focus:border-cyan-400/50 text-zinc-100 text-sm px-4 py-3 outline-none transition-colors placeholder:text-zinc-600';
const selectCls =
  'w-full bg-zinc-900 border border-zinc-800 focus:border-cyan-400/50 text-zinc-100 text-sm px-4 py-3 outline-none transition-colors';
const labelCls = 'block text-[10px] font-bold text-zinc-500 tracking-[0.2em] uppercase mb-2';
const fieldErrorCls = 'mt-1.5 text-[10px] text-red-400';

const BUDGET_RANGES = [
  'Under $1,000',
  '$1,000 – $2,500',
  '$2,500 – $5,000',
  '$5,000 – $10,000',
  '$10,000 – $25,000',
  '$25,000+',
  'Flexible / TBD',
];

const TIMELINES = [
  'As soon as possible',
  'Within 1 month',
  '1–3 months',
  '3–6 months',
  '6+ months',
  'No rush / planning stage',
];

const TRANSMISSIONS = ['Manual', 'Automatic', 'DCT / Dual-Clutch', 'CVT', 'Other'];

type FieldErrors = Partial<Record<string, string[]>>;

export default function QuoteRequestForm({ session, prefillProductSlug, prefillProductName }: Props) {
  const router = useRouter();

  const [form, setForm] = useState({
    customerName: session?.name ?? '',
    customerEmail: session?.email ?? '',
    customerPhone: '',
    preferredContactMethod: 'email' as 'phone' | 'whatsapp' | 'email',

    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    vehicleEngine: '',
    transmission: '',
    mileage: '',
    currentModifications: '',

    serviceCategory: '' as string,
    performanceGoal: '',
    budgetRange: '',
    desiredTimeline: '',
    message: '',

    relatedProductSlug: prefillProductSlug ?? '',
  });

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const set = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validate = (): boolean => {
    const errors: FieldErrors = {};

    if (!form.customerName.trim()) errors.customerName = ['Full name is required'];
    if (!form.customerEmail.trim()) errors.customerEmail = ['Email is required'];
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customerEmail))
      errors.customerEmail = ['Enter a valid email address'];
    if (!form.customerPhone.trim()) errors.customerPhone = ['Phone number is required'];

    if (!form.vehicleMake.trim()) errors.vehicleMake = ['Vehicle make is required'];
    if (!form.vehicleModel.trim()) errors.vehicleModel = ['Vehicle model is required'];
    if (!form.vehicleYear.trim()) {
      errors.vehicleYear = ['Year is required'];
    } else if (!/^\d{4}$/.test(form.vehicleYear)) {
      errors.vehicleYear = ['Enter a 4-digit year'];
    } else {
      const y = parseInt(form.vehicleYear, 10);
      if (y < 1900 || y > new Date().getFullYear() + 2)
        errors.vehicleYear = ['Enter a valid vehicle year'];
    }

    if (!form.serviceCategory) errors.serviceCategory = ['Select a service category'];

    if (!form.message.trim()) {
      errors.message = ['Project description is required'];
    } else if (form.message.trim().length < 20) {
      errors.message = ['Please describe your project in at least 20 characters'];
    } else if (form.message.length > 2000) {
      errors.message = ['Description must be 2000 characters or fewer'];
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: form.customerName.trim(),
          customerEmail: form.customerEmail.trim(),
          customerPhone: form.customerPhone.trim(),
          preferredContactMethod: form.preferredContactMethod,
          vehicleMake: form.vehicleMake.trim(),
          vehicleModel: form.vehicleModel.trim(),
          vehicleYear: form.vehicleYear.trim(),
          vehicleEngine: form.vehicleEngine.trim() || undefined,
          transmission: form.transmission || undefined,
          mileage: form.mileage.trim() || undefined,
          currentModifications: form.currentModifications.trim() || undefined,
          serviceCategory: form.serviceCategory,
          performanceGoal: form.performanceGoal.trim() || undefined,
          budgetRange: form.budgetRange || undefined,
          desiredTimeline: form.desiredTimeline || undefined,
          message: form.message.trim(),
          relatedProductSlug: form.relatedProductSlug || undefined,
        }),
      });

      const data = await res.json() as { quoteNumber?: string; error?: string; issues?: FieldErrors };

      if (!res.ok) {
        if (data.issues) setFieldErrors(data.issues);
        else setSubmitError(data.error ?? 'Submission failed. Please try again.');
        return;
      }

      router.push(`/quote/success?ref=${encodeURIComponent(data.quoteNumber ?? '')}`);
    } catch {
      setSubmitError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-10">
      {/* Customer Information */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 flex items-center justify-center border border-cyan-400/30 bg-cyan-400/5 shrink-0">
            <User size={14} className="text-cyan-400" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-xs font-black text-white tracking-[0.2em] uppercase">
              Customer Information
            </h3>
            <p className="text-[10px] text-zinc-600 mt-0.5">How we can reach you</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="customerName" className={labelCls}>
              Full Name <span className="text-red-400">*</span>
            </label>
            <input
              id="customerName"
              type="text"
              value={form.customerName}
              onChange={set('customerName')}
              placeholder="Your full name"
              className={inputCls}
              autoComplete="name"
            />
            {fieldErrors.customerName && (
              <p className={fieldErrorCls}>{fieldErrors.customerName[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="customerEmail" className={labelCls}>
              Email Address <span className="text-red-400">*</span>
            </label>
            <input
              id="customerEmail"
              type="email"
              value={form.customerEmail}
              onChange={set('customerEmail')}
              placeholder="your@email.com"
              className={inputCls}
              autoComplete="email"
            />
            {fieldErrors.customerEmail && (
              <p className={fieldErrorCls}>{fieldErrors.customerEmail[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="customerPhone" className={labelCls}>
              Phone Number <span className="text-red-400">*</span>
            </label>
            <input
              id="customerPhone"
              type="tel"
              value={form.customerPhone}
              onChange={set('customerPhone')}
              placeholder="+1 555 000 0000"
              className={inputCls}
              autoComplete="tel"
            />
            {fieldErrors.customerPhone && (
              <p className={fieldErrorCls}>{fieldErrors.customerPhone[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="preferredContactMethod" className={labelCls}>
              Preferred Contact
            </label>
            <select
              id="preferredContactMethod"
              value={form.preferredContactMethod}
              onChange={set('preferredContactMethod')}
              className={selectCls}
            >
              <option value="email">Email</option>
              <option value="phone">Phone Call</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </div>
        </div>
      </section>

      {/* Vehicle Information */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 flex items-center justify-center border border-cyan-400/30 bg-cyan-400/5 shrink-0">
            <Car size={14} className="text-cyan-400" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-xs font-black text-white tracking-[0.2em] uppercase">
              Vehicle Information
            </h3>
            <p className="text-[10px] text-zinc-600 mt-0.5">Tell us about your car</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="vehicleMake" className={labelCls}>
              Make <span className="text-red-400">*</span>
            </label>
            <input
              id="vehicleMake"
              type="text"
              value={form.vehicleMake}
              onChange={set('vehicleMake')}
              placeholder="e.g. BMW, Toyota, Ford"
              className={inputCls}
            />
            {fieldErrors.vehicleMake && (
              <p className={fieldErrorCls}>{fieldErrors.vehicleMake[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="vehicleModel" className={labelCls}>
              Model <span className="text-red-400">*</span>
            </label>
            <input
              id="vehicleModel"
              type="text"
              value={form.vehicleModel}
              onChange={set('vehicleModel')}
              placeholder="e.g. M3, Supra, Mustang GT"
              className={inputCls}
            />
            {fieldErrors.vehicleModel && (
              <p className={fieldErrorCls}>{fieldErrors.vehicleModel[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="vehicleYear" className={labelCls}>
              Year <span className="text-red-400">*</span>
            </label>
            <input
              id="vehicleYear"
              type="text"
              value={form.vehicleYear}
              onChange={set('vehicleYear')}
              placeholder="e.g. 2021"
              maxLength={4}
              className={inputCls}
            />
            {fieldErrors.vehicleYear && (
              <p className={fieldErrorCls}>{fieldErrors.vehicleYear[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="vehicleEngine" className={labelCls}>
              Engine
            </label>
            <input
              id="vehicleEngine"
              type="text"
              value={form.vehicleEngine}
              onChange={set('vehicleEngine')}
              placeholder="e.g. 3.0L Inline-6 Turbo"
              className={inputCls}
            />
          </div>

          <div>
            <label htmlFor="transmission" className={labelCls}>
              Transmission
            </label>
            <select
              id="transmission"
              value={form.transmission}
              onChange={set('transmission')}
              className={selectCls}
            >
              <option value="">Select transmission (optional)</option>
              {TRANSMISSIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="mileage" className={labelCls}>
              Mileage
            </label>
            <input
              id="mileage"
              type="text"
              value={form.mileage}
              onChange={set('mileage')}
              placeholder="e.g. 45,000 miles"
              className={inputCls}
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="currentModifications" className={labelCls}>
              Current Modifications
            </label>
            <textarea
              id="currentModifications"
              value={form.currentModifications}
              onChange={set('currentModifications')}
              rows={3}
              placeholder="List any existing mods: intake, exhaust, suspension, etc. Leave blank if stock."
              className={`${inputCls} resize-none`}
            />
          </div>
        </div>
      </section>

      {/* Project Details */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 flex items-center justify-center border border-cyan-400/30 bg-cyan-400/5 shrink-0">
            <Wrench size={14} className="text-cyan-400" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-xs font-black text-white tracking-[0.2em] uppercase">
              Project Details
            </h3>
            <p className="text-[10px] text-zinc-600 mt-0.5">Describe your performance goals</p>
          </div>
        </div>

        {prefillProductName && (
          <div className="mb-4 flex items-center gap-3 px-4 py-3 border border-cyan-400/20 bg-cyan-400/5">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" aria-hidden="true" />
            <p className="text-xs text-zinc-300">
              Requesting quote for:{' '}
              <span className="font-black text-cyan-400">{prefillProductName}</span>
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="serviceCategory" className={labelCls}>
              Service / Category <span className="text-red-400">*</span>
            </label>
            <select
              id="serviceCategory"
              value={form.serviceCategory}
              onChange={set('serviceCategory')}
              className={selectCls}
            >
              <option value="">Select a service…</option>
              {SERVICE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {fieldErrors.serviceCategory && (
              <p className={fieldErrorCls}>{fieldErrors.serviceCategory[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="performanceGoal" className={labelCls}>
              Performance Goal
            </label>
            <input
              id="performanceGoal"
              type="text"
              value={form.performanceGoal}
              onChange={set('performanceGoal')}
              placeholder="e.g. 400whp, track-ready, daily driver"
              className={inputCls}
            />
          </div>

          <div>
            <label htmlFor="budgetRange" className={labelCls}>
              Budget Range
            </label>
            <select
              id="budgetRange"
              value={form.budgetRange}
              onChange={set('budgetRange')}
              className={selectCls}
            >
              <option value="">Select budget (optional)</option>
              {BUDGET_RANGES.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="desiredTimeline" className={labelCls}>
              Desired Timeline
            </label>
            <select
              id="desiredTimeline"
              value={form.desiredTimeline}
              onChange={set('desiredTimeline')}
              className={selectCls}
            >
              <option value="">Select timeline (optional)</option>
              {TIMELINES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="message" className={labelCls}>
              Project Description <span className="text-red-400">*</span>
            </label>
            <textarea
              id="message"
              value={form.message}
              onChange={set('message')}
              rows={6}
              placeholder="Describe your goals, current issues, what you'd like to achieve, and any questions for our team. The more detail, the more accurate your quote."
              className={`${inputCls} resize-none`}
              maxLength={2000}
            />
            <div className="flex items-start justify-between mt-1.5">
              <div>
                {fieldErrors.message && (
                  <p className={fieldErrorCls}>{fieldErrors.message[0]}</p>
                )}
              </div>
              <p className="text-[10px] text-zinc-700 shrink-0 ml-4">
                {form.message.length}/2000
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Submit error */}
      {submitError && (
        <div className="flex items-start gap-3 border border-red-400/30 bg-red-400/5 p-4">
          <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-xs text-red-300">{submitError}</p>
        </div>
      )}

      {/* Submit */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2.5 px-8 py-4 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed text-black font-black text-xs tracking-[0.2em] uppercase transition-all duration-200 hover:shadow-[0_0_32px_rgba(0,212,255,0.4)]"
        >
          {submitting ? (
            <>
              <Loader2 size={13} className="animate-spin" aria-hidden="true" />
              Submitting…
            </>
          ) : (
            <>
              Submit Quote Request
              <ChevronRight size={13} aria-hidden="true" />
            </>
          )}
        </button>
        <p className="text-[10px] text-zinc-600 leading-relaxed max-w-xs">
          We typically respond within 1–2 business days. No commitment required.
        </p>
      </div>
    </form>
  );
}
