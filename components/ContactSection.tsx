'use client';

import { useState, type FormEvent } from 'react';
import { Phone, Mail, MapPin, Clock, MessageCircle, ExternalLink, CheckCircle } from 'lucide-react';
import SectionHeader from '@/components/SectionHeader';
import { useContactInfo } from '@/lib/useContactInfo';
import { buildWhatsAppUrl, buildTelUrl, buildMailtoUrl } from '@/lib/contact';

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

const inputCls =
  'w-full bg-zinc-900 border border-zinc-800 focus:border-cyan-400/50 text-zinc-100 text-sm px-4 py-3 outline-none transition-colors duration-200 placeholder:text-zinc-600 focus:bg-zinc-900/80';

export default function ContactSection() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [submitted, setSubmitted] = useState(false);
  const { info } = useContactInfo();

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

  const waUrl = buildWhatsAppUrl(
    info.whatsappNumber,
    info.defaultWhatsAppMessage || undefined
  );
  const telUrl = buildTelUrl(info.contactPhone);
  const mailUrl = buildMailtoUrl(info.contactEmail);

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
            {/* Phone */}
            {info.contactPhone && (
              <div className="flex items-start gap-4 p-5 border border-zinc-800/50 bg-zinc-900/20">
                <div className="w-9 h-9 shrink-0 flex items-center justify-center border border-zinc-700/50 bg-zinc-900">
                  <Phone className="text-cyan-400" size={16} aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-zinc-500 tracking-[0.2em] uppercase font-bold mb-0.5">
                    Call Us
                  </p>
                  {telUrl ? (
                    <a
                      href={telUrl}
                      data-contact-action="phone-click"
                      className="text-sm font-semibold text-white hover:text-cyan-400 transition-colors"
                    >
                      {info.contactPhone}
                    </a>
                  ) : (
                    <p className="text-sm font-semibold text-white">{info.contactPhone}</p>
                  )}
                  {info.workingHours && (
                    <p className="text-xs text-zinc-500 mt-0.5">{info.workingHours}</p>
                  )}
                </div>
              </div>
            )}

            {/* WhatsApp */}
            {waUrl && (
              <div className="flex items-start gap-4 p-5 border border-zinc-800/50 bg-zinc-900/20">
                <div className="w-9 h-9 shrink-0 flex items-center justify-center border border-zinc-700/50 bg-zinc-900">
                  <MessageCircle className="text-cyan-400" size={16} aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-zinc-500 tracking-[0.2em] uppercase font-bold mb-0.5">
                    WhatsApp
                  </p>
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-contact-action="whatsapp-click"
                    className="text-sm font-semibold text-white hover:text-cyan-400 transition-colors"
                  >
                    Message Us Directly
                  </a>
                  <p className="text-xs text-zinc-500 mt-0.5">Fastest way to reach us</p>
                </div>
              </div>
            )}

            {/* Email */}
            {info.contactEmail && (
              <div className="flex items-start gap-4 p-5 border border-zinc-800/50 bg-zinc-900/20">
                <div className="w-9 h-9 shrink-0 flex items-center justify-center border border-zinc-700/50 bg-zinc-900">
                  <Mail className="text-cyan-400" size={16} aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-zinc-500 tracking-[0.2em] uppercase font-bold mb-0.5">
                    Email
                  </p>
                  {mailUrl ? (
                    <a
                      href={mailUrl}
                      data-contact-action="email-click"
                      className="text-sm font-semibold text-white hover:text-cyan-400 transition-colors break-all"
                    >
                      {info.contactEmail}
                    </a>
                  ) : (
                    <p className="text-sm font-semibold text-white break-all">{info.contactEmail}</p>
                  )}
                  <p className="text-xs text-zinc-500 mt-0.5">We reply within 24 hours</p>
                </div>
              </div>
            )}

            {/* Address */}
            {info.address && (
              <div className="flex items-start gap-4 p-5 border border-zinc-800/50 bg-zinc-900/20">
                <div className="w-9 h-9 shrink-0 flex items-center justify-center border border-zinc-700/50 bg-zinc-900">
                  <MapPin className="text-cyan-400" size={16} aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-zinc-500 tracking-[0.2em] uppercase font-bold mb-0.5">
                    Workshop
                  </p>
                  <p className="text-sm font-semibold text-white">{info.address}</p>
                  {info.googleMapsUrl && (
                    <a
                      href={info.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 mt-1 transition-colors"
                    >
                      <ExternalLink size={10} aria-hidden="true" />
                      Get Directions
                    </a>
                  )}
                  <p className="text-xs text-zinc-500 mt-0.5">Open by appointment</p>
                </div>
              </div>
            )}

            {/* Working hours */}
            {info.workingHours && (
              <div className="p-5 border border-zinc-800/50 bg-zinc-900/20 flex items-start gap-4">
                <div className="w-9 h-9 shrink-0 flex items-center justify-center border border-zinc-700/50 bg-zinc-900">
                  <Clock className="text-cyan-400" size={16} aria-hidden="true" />
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500 tracking-[0.2em] uppercase font-bold mb-1">
                    Working Hours
                  </p>
                  <p className="text-sm text-zinc-300 leading-relaxed">{info.workingHours}</p>
                </div>
              </div>
            )}
          </div>

          {/* ── Right: form ── */}
          <div className="border border-zinc-800/50 bg-zinc-900/20 p-7 lg:p-9">
            {submitted ? (
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

                {/* WhatsApp shortcut */}
                {waUrl && (
                  <div className="flex items-center gap-3 py-3 border-t border-zinc-800/50">
                    <p className="text-[10px] text-zinc-600">Prefer instant messaging?</p>
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-contact-action="whatsapp-click"
                      className="inline-flex items-center gap-1.5 text-[10px] font-bold text-cyan-400 hover:text-cyan-300 uppercase tracking-wider transition-colors"
                    >
                      <MessageCircle size={10} aria-hidden="true" />
                      Message on WhatsApp
                    </a>
                  </div>
                )}

                <button
                  type="submit"
                  className="mt-2 w-full py-4 bg-cyan-400 hover:bg-cyan-300 text-black font-black text-xs tracking-[0.25em] uppercase transition-all duration-200 hover:shadow-[0_0_30px_rgba(0,212,255,0.5)]"
                >
                  Send Build Request
                </button>

                <p className="text-[10px] text-zinc-600 text-center leading-relaxed">
                  We never share your details with third parties. All data is treated with strict confidence.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
