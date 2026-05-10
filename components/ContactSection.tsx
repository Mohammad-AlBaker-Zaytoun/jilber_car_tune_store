'use client';

import { useState, type FormEvent } from 'react';
import { Phone, Mail, MapPin, CheckCircle } from 'lucide-react';
import SectionHeader from '@/components/SectionHeader';

// ── Static data lifted out of the component to avoid recreation on every render ──

const SERVICES_LIST = [
  'ECU Tuning',
  'Exhaust Systems',
  'Suspension Tuning',
  'Performance Diagnostics',
  'Custom Build',
  'Aero Kit',
  'Wheels & Fitment',
  'Track Upgrades',
  'Other / Unsure',
] as const;

const CONTACT_ITEMS = [
  {
    Icon: Phone,
    label: 'Call Us',
    value: '+1 (555) 000-0000',
    sub: 'Mon–Sat, 8 am – 7 pm',
  },
  {
    Icon: Mail,
    label: 'Email',
    value: 'builds@jilber.com',
    sub: 'We reply within 24 hours',
  },
  {
    Icon: MapPin,
    label: 'Workshop',
    value: '14 Industrial Way, Unit 6',
    sub: 'Open by appointment',
  },
] as const;

const HOURS = [
  { day: 'Monday – Friday', time: '8:00 am – 7:00 pm' },
  { day: 'Saturday', time: '9:00 am – 5:00 pm' },
  { day: 'Sunday', time: 'Closed' },
] as const;

// ── Types ──

type FormState = {
  name: string;
  email: string;
  phone: string;
  vehicle: string;
  service: string;
  message: string;
};

const INITIAL_FORM: FormState = {
  name: '',
  email: '',
  phone: '',
  vehicle: '',
  service: '',
  message: '',
};

// Shared input/textarea/select styling
const inputCls =
  'w-full bg-zinc-900 border border-zinc-800 focus:border-cyan-400/50 text-zinc-100 text-sm px-4 py-3 outline-none transition-colors duration-200 placeholder:text-zinc-600 focus:bg-zinc-900/80';

export default function ContactSection() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const reset = () => {
    setForm(INITIAL_FORM);
    setSubmitted(false);
  };

  return (
    <section id="contact" className="relative py-24 lg:py-32 bg-black">
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 100%, rgba(0,212,255,0.04), transparent)',
        }}
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <SectionHeader
          tag="Book a Consultation"
          heading={
            <>
              LET&apos;S BUILD
              <br />
              <span className="text-cyan-400">YOUR VISION</span>
            </>
          }
          sub="Tell us about your car and your goals. We will get back to you within 24 hours with a tailored proposal."
          align="center"
          className="mb-14 lg:mb-20"
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-10 lg:gap-16">
          {/* ── Left: contact info ── */}
          <div className="flex flex-col gap-4 lg:gap-5">
            {CONTACT_ITEMS.map(({ Icon, label, value, sub }) => (
              <div
                key={label}
                className="flex items-start gap-4 p-5 border border-zinc-800/50 bg-zinc-900/20"
              >
                <div className="w-9 h-9 shrink-0 flex items-center justify-center border border-zinc-700/50 bg-zinc-900">
                  <Icon className="text-cyan-400" size={16} aria-hidden="true" />
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500 tracking-[0.2em] uppercase font-bold mb-0.5">
                    {label}
                  </p>
                  <p className="text-sm font-semibold text-white">{value}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{sub}</p>
                </div>
              </div>
            ))}

            {/* Hours */}
            <div className="p-5 border border-zinc-800/50 bg-zinc-900/20">
              <h4 className="text-[10px] text-zinc-500 tracking-[0.25em] uppercase font-bold mb-4">
                Workshop Hours
              </h4>
              <div className="flex flex-col gap-2.5">
                {HOURS.map(({ day, time }) => (
                  <div key={day} className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">{day}</span>
                    <span className="text-zinc-300 font-medium">{time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right: form ── */}
          <div className="border border-zinc-800/50 bg-zinc-900/20 p-7 lg:p-9">
            {submitted ? (
              /* Success state */
              <div className="h-full flex flex-col items-center justify-center text-center py-12 gap-0">
                <div className="w-14 h-14 flex items-center justify-center border border-cyan-400/30 bg-cyan-400/5 mb-6">
                  <CheckCircle className="text-cyan-400" size={24} aria-hidden="true" />
                </div>
                <h3 className="text-xl font-black text-white mb-2">Request Received</h3>
                <p className="text-sm text-zinc-400 max-w-xs leading-relaxed">
                  Thank you for reaching out. A member of our team will contact you
                  within 24 hours to discuss your build.
                </p>
                <button
                  onClick={reset}
                  className="mt-8 px-6 py-3 border border-zinc-700 hover:border-cyan-400/40 text-zinc-300 hover:text-cyan-400 text-xs font-bold tracking-[0.2em] uppercase transition-all duration-200"
                >
                  Send Another Request
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
                {/* Row 1 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="name"
                      className="text-[10px] text-zinc-500 tracking-[0.2em] uppercase font-bold"
                    >
                      Full Name <span className="text-cyan-400">*</span>
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      autoComplete="name"
                      value={form.name}
                      onChange={handleChange}
                      className={inputCls}
                      placeholder="John Smith"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="email"
                      className="text-[10px] text-zinc-500 tracking-[0.2em] uppercase font-bold"
                    >
                      Email <span className="text-cyan-400">*</span>
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      value={form.email}
                      onChange={handleChange}
                      className={inputCls}
                      placeholder="you@email.com"
                    />
                  </div>
                </div>

                {/* Row 2 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="phone"
                      className="text-[10px] text-zinc-500 tracking-[0.2em] uppercase font-bold"
                    >
                      Phone
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      value={form.phone}
                      onChange={handleChange}
                      className={inputCls}
                      placeholder="+1 555 000 0000"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="vehicle"
                      className="text-[10px] text-zinc-500 tracking-[0.2em] uppercase font-bold"
                    >
                      Vehicle <span className="text-cyan-400">*</span>
                    </label>
                    <input
                      id="vehicle"
                      name="vehicle"
                      type="text"
                      required
                      autoComplete="off"
                      value={form.vehicle}
                      onChange={handleChange}
                      className={inputCls}
                      placeholder="2023 BMW M3 Competition"
                    />
                  </div>
                </div>

                {/* Service dropdown */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="service"
                    className="text-[10px] text-zinc-500 tracking-[0.2em] uppercase font-bold"
                  >
                    Service Interested In <span className="text-cyan-400">*</span>
                  </label>
                  <select
                    id="service"
                    name="service"
                    required
                    value={form.service}
                    onChange={handleChange}
                    className={`${inputCls} appearance-none cursor-pointer`}
                  >
                    <option value="" disabled>
                      Select a service…
                    </option>
                    {SERVICES_LIST.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Goals textarea */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="message"
                    className="text-[10px] text-zinc-500 tracking-[0.2em] uppercase font-bold"
                  >
                    Your Goals
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    value={form.message}
                    onChange={handleChange}
                    className={`${inputCls} resize-none`}
                    placeholder="Tell us about your car, goals, and timeline…"
                  />
                </div>

                <button
                  type="submit"
                  className="mt-2 w-full py-4 bg-cyan-400 hover:bg-cyan-300 text-black font-black text-xs tracking-[0.25em] uppercase transition-all duration-200 hover:shadow-[0_0_30px_rgba(0,212,255,0.5)]"
                >
                  Send Build Request
                </button>

                <p className="text-[10px] text-zinc-600 text-center leading-relaxed">
                  We never share your details with third parties. All data is
                  treated with strict confidence.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
