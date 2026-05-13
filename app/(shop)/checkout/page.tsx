'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CreditCard, Banknote, Store, ChevronRight } from 'lucide-react';
import { useCartStore } from '@/lib/cart';
import { useAuth } from '@/components/auth/AuthProvider';
import OrderSummary from '@/components/cart/OrderSummary';
import EmptyState from '@/components/store/EmptyState';
import SupportCtaCard from '@/components/contact/SupportCtaCard';

type PaymentMethod = 'shop' | 'card' | 'bank';

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  carMake: string;
  carModel: string;
  carYear: string;
  engine: string;
  currentMods: string;
  serviceDate: string;
}

const INITIAL_FORM: FormData = {
  fullName: '',
  email: '',
  phone: '',
  address: '',
  carMake: '',
  carModel: '',
  carYear: '',
  engine: '',
  currentMods: '',
  serviceDate: '',
};

const inputCls =
  'w-full bg-zinc-900 border border-zinc-800 focus:border-cyan-400/50 text-zinc-100 text-sm px-4 py-3 outline-none transition-colors duration-200 placeholder:text-zinc-600';

const labelCls =
  'block text-[10px] text-zinc-500 tracking-[0.2em] uppercase font-bold mb-1.5';

function Field({
  label,
  id,
  required,
  error,
  children,
}: {
  label: string;
  id: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <label htmlFor={id} className={labelCls}>
        {label}
        {required && <span className="text-cyan-400 ml-1">*</span>}
      </label>
      {children}
      {error && <p className="text-red-400 text-[10px] mt-1">{error}</p>}
    </div>
  );
}

const PAYMENT_OPTIONS: { id: PaymentMethod; label: string; sub: string; Icon: React.ElementType }[] = [
  {
    id: 'shop',
    label: 'Pay at Workshop',
    sub: 'Pay on arrival. Confirm your appointment to secure your slot.',
    Icon: Store,
  },
  {
    id: 'bank',
    label: 'Bank Transfer',
    sub: 'We will email payment details after order confirmation.',
    Icon: Banknote,
  },
  {
    id: 'card',
    label: 'Card Payment',
    sub: 'Online card payment — coming soon.',
    Icon: CreditCard,
  },
];

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const { user } = useAuth();
  const [form, setForm] = useState<FormData>(INITIAL_FORM);

  // Prefill contact fields from the signed-in user on mount
  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        fullName: prev.fullName || user.name,
        email: prev.email || user.email,
        phone: prev.phone || (user.phone ?? ''),
      }));
    }
  }, [user]);
  const [payment, setPayment] = useState<PaymentMethod>('shop');
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  if (items.length === 0) {
    return (
      <div className="bg-zinc-950 pt-28 min-h-screen">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <EmptyState variant="empty-cart" />
        </div>
      </div>
    );
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
  };

  const validate = (): boolean => {
    const errs: Partial<FormData> = {};
    if (!form.fullName.trim()) errs.fullName = 'Required';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Valid email required';
    if (!form.phone.trim()) errs.phone = 'Required';
    if (!form.carMake.trim()) errs.carMake = 'Required';
    if (!form.carModel.trim()) errs.carModel = 'Required';
    if (!form.carYear.trim()) errs.carYear = 'Required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const placeOrder = async () => {
    if (!validate()) return;
    setSubmitError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: {
            fullName: form.fullName,
            email: form.email,
            phone: form.phone,
            address: form.address,
          },
          vehicle: {
            make: form.carMake,
            model: form.carModel,
            year: form.carYear,
            engine: form.engine,
            currentMods: form.currentMods,
            serviceDate: form.serviceDate,
          },
          // Send only the fields the server needs; price/totals are derived server-side
          items: items.map((i) => ({ slug: i.slug, quantity: i.quantity })),
          payment,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setSubmitError(data.error ?? 'Failed to place order. Please try again.');
        return;
      }

      const data = (await res.json()) as { orderId: string; ref: string };
      clearCart();
      router.push(`/checkout/success?ref=${encodeURIComponent(data.ref)}`);
    } catch {
      setSubmitError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void placeOrder();
  };

  return (
    <div className="bg-zinc-950 pt-28 lg:pt-32 pb-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase font-semibold mb-10">
          <Link href="/cart" className="text-zinc-600 hover:text-cyan-400 transition-colors">Cart</Link>
          <ChevronRight size={10} className="text-zinc-700" />
          <span className="text-zinc-400">Checkout</span>
        </nav>

        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2.5 mb-4">
            <div className="w-7 h-px bg-cyan-400 shrink-0" aria-hidden="true" />
            <span className="text-[10px] text-cyan-400 tracking-[0.3em] uppercase font-bold">
              Finalise Order
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-none">
            CHECKOUT
          </h1>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 lg:gap-12">
            {/* Left: forms */}
            <div className="flex flex-col gap-7">
              {/* Contact info */}
              <div className="border border-zinc-800/50 bg-zinc-900/20 p-7">
                <h2 className="text-xs font-black text-white tracking-[0.25em] uppercase mb-6">
                  01 — Contact Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Full Name" id="fullName" required error={errors.fullName}>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      autoComplete="name"
                      value={form.fullName}
                      onChange={handleChange}
                      placeholder="John Smith"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Email" id="email" required error={errors.email}>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="you@email.com"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Phone" id="phone" required error={errors.phone}>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="+1 555 000 0000"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Address" id="address">
                    <input
                      id="address"
                      name="address"
                      type="text"
                      autoComplete="street-address"
                      value={form.address}
                      onChange={handleChange}
                      placeholder="Street, City"
                      className={inputCls}
                    />
                  </Field>
                </div>
              </div>

              {/* Vehicle info */}
              <div className="border border-zinc-800/50 bg-zinc-900/20 p-7">
                <h2 className="text-xs font-black text-white tracking-[0.25em] uppercase mb-6">
                  02 — Vehicle Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Car Make" id="carMake" required error={errors.carMake}>
                    <input
                      id="carMake"
                      name="carMake"
                      type="text"
                      value={form.carMake}
                      onChange={handleChange}
                      placeholder="BMW"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Car Model" id="carModel" required error={errors.carModel}>
                    <input
                      id="carModel"
                      name="carModel"
                      type="text"
                      value={form.carModel}
                      onChange={handleChange}
                      placeholder="M3 Competition"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Year" id="carYear" required error={errors.carYear}>
                    <input
                      id="carYear"
                      name="carYear"
                      type="text"
                      inputMode="numeric"
                      value={form.carYear}
                      onChange={handleChange}
                      placeholder="2023"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Engine" id="engine">
                    <input
                      id="engine"
                      name="engine"
                      type="text"
                      value={form.engine}
                      onChange={handleChange}
                      placeholder="S58 3.0T"
                      className={inputCls}
                    />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="Current Modifications" id="currentMods">
                      <textarea
                        id="currentMods"
                        name="currentMods"
                        rows={3}
                        value={form.currentMods}
                        onChange={handleChange}
                        placeholder="Downpipe, intercooler, cold air intake…"
                        className={`${inputCls} resize-none`}
                      />
                    </Field>
                  </div>
                  <Field label="Preferred Service Date" id="serviceDate">
                    <input
                      id="serviceDate"
                      name="serviceDate"
                      type="date"
                      value={form.serviceDate}
                      onChange={handleChange}
                      className={`${inputCls} scheme-dark`}
                    />
                  </Field>
                </div>
              </div>

              {/* Payment */}
              <div className="border border-zinc-800/50 bg-zinc-900/20 p-7">
                <h2 className="text-xs font-black text-white tracking-[0.25em] uppercase mb-6">
                  03 — Payment Method
                </h2>
                <div className="flex flex-col gap-3">
                  {PAYMENT_OPTIONS.map(({ id, label, sub, Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => id !== 'card' && setPayment(id)}
                      disabled={id === 'card'}
                      className={`flex items-start gap-4 p-4 border text-left transition-all duration-200 ${
                        payment === id
                          ? 'border-cyan-400/50 bg-cyan-400/5'
                          : 'border-zinc-800 hover:border-zinc-700'
                      } disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                      <div className={`w-8 h-8 shrink-0 flex items-center justify-center border ${payment === id ? 'border-cyan-400/40 bg-cyan-400/10' : 'border-zinc-700 bg-zinc-900'} mt-0.5`}>
                        <Icon size={14} className={payment === id ? 'text-cyan-400' : 'text-zinc-500'} aria-hidden="true" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className={`text-xs font-black tracking-wide uppercase ${payment === id ? 'text-white' : 'text-zinc-400'}`}>
                            {label}
                          </p>
                          {id === 'card' && (
                            <span className="text-[9px] border border-zinc-700 text-zinc-600 px-1.5 py-0.5 font-bold tracking-wide uppercase">
                              Soon
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">{sub}</p>
                      </div>
                      <div className={`w-4 h-4 rounded-full border shrink-0 mt-1 flex items-center justify-center ${payment === id ? 'border-cyan-400 bg-cyan-400' : 'border-zinc-700'}`}>
                        {payment === id && (
                          <div className="w-1.5 h-1.5 rounded-full bg-black" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                <p className="mt-4 text-[10px] text-zinc-700 leading-relaxed">
                  This is a mock checkout. No real payment is processed. No card data is collected.
                </p>
              </div>
            </div>

            {/* Right: order summary */}
            <div className="flex flex-col gap-4">
              {submitError && (
                <div className="flex items-start gap-2.5 p-4 border border-red-500/30 bg-red-500/5 text-red-400 text-xs leading-relaxed">
                  <span className="shrink-0 mt-0.5" aria-hidden="true">!</span>
                  {submitError}
                </div>
              )}
              <OrderSummary
                showCheckoutButton
                showItems
                onCheckout={placeOrder}
                isSubmitting={submitting}
              />
              <SupportCtaCard
                heading="Need help completing your order?"
                body="Our team can walk you through the checkout process or answer any questions."
                whatsappMessage="Hello, I need help completing my order on your website."
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
