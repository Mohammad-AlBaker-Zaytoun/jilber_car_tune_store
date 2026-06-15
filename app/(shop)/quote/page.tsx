import type { Metadata } from 'next';
import { getSession } from '@/lib/session';
import { getProductBySlug } from '@/lib/products';
import { getSettings } from '@/lib/settings';
import QuoteRequestForm from '@/components/quotes/QuoteRequestForm';
import { CheckCircle, Phone, Clock, Wrench, MessageCircle } from 'lucide-react';
import { buildWhatsAppUrl, buildTelUrl } from '@/lib/contact';

export const metadata: Metadata = {
  title: 'Request a Performance Quote',
  description:
    'Request a custom quote for ECU tuning, exhaust systems, suspension upgrades, diagnostics, track packages, and full performance builds.',
};

export default async function QuotePage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string }>;
}) {
  const [session, sp, settings] = await Promise.all([getSession(), searchParams, getSettings()]);

  const productSlug = sp.product ?? '';
  let prefillProductName: string | undefined;

  if (productSlug) {
    const product = await getProductBySlug(productSlug);
    if (product) prefillProductName = product.name;
  }

  return (
    <div className="bg-zinc-950 pt-28 lg:pt-32 pb-20 lg:pb-28 min-h-screen">
      {/* Hero */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 mb-16">
        <div className="inline-flex items-center gap-2.5 mb-5">
          <div className="w-7 h-px bg-cyan-400 shrink-0" aria-hidden="true" />
          <span className="text-[10px] text-cyan-400 tracking-[0.3em] uppercase font-bold">
            Custom Performance
          </span>
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none mb-6">
          REQUEST A<br />
          <span className="text-cyan-400">QUOTE</span>
        </h1>
        <p className="text-base text-zinc-400 leading-relaxed max-w-2xl">
          Every build is different. Tell us about your vehicle and goals — our team will review your
          details and come back with a tailored quote and next steps.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-12 lg:gap-16">
          {/* Form */}
          <div>
            <div className="border border-zinc-800/50 bg-zinc-900/10 p-8 lg:p-10">
              <QuoteRequestForm
                session={session}
                prefillProductSlug={productSlug || undefined}
                prefillProductName={prefillProductName}
              />
            </div>
          </div>

          {/* Sidebar */}
          <aside className="flex flex-col gap-6">
            {/* Process */}
            <div className="border border-zinc-800/50 bg-zinc-900/20 p-6">
              <h2 className="text-xs font-black text-white tracking-[0.25em] uppercase mb-5">
                How It Works
              </h2>
              <div className="flex flex-col gap-5">
                {[
                  {
                    step: '01',
                    title: 'Submit Your Request',
                    body: 'Fill in the form with your vehicle details and performance goals.',
                  },
                  {
                    step: '02',
                    title: 'We Review & Plan',
                    body: 'Our engineers assess your build and prepare a detailed proposal.',
                  },
                  {
                    step: '03',
                    title: 'Receive Your Quote',
                    body: 'We contact you with a clear, itemised quote and timeline.',
                  },
                  {
                    step: '04',
                    title: 'Book Your Build',
                    body: 'Approve the quote and schedule your vehicle drop-off.',
                  },
                ].map(({ step, title, body }) => (
                  <div key={step} className="flex gap-4">
                    <span className="text-lg font-black text-cyan-400/30 w-8 shrink-0 leading-none pt-0.5">
                      {step}
                    </span>
                    <div>
                      <p className="text-xs font-black text-white mb-1">{title}</p>
                      <p className="text-[11px] text-zinc-500 leading-relaxed">{body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trust highlights */}
            <div className="border border-zinc-800/50 bg-zinc-900/20 p-6">
              <h2 className="text-xs font-black text-white tracking-[0.25em] uppercase mb-5">
                Why JILBER
              </h2>
              <div className="flex flex-col gap-4">
                {[
                  { icon: Wrench, label: 'Expert Technicians', body: 'Experienced in all aspects of performance builds and tuning.' },
                  { icon: CheckCircle, label: 'No Commitment', body: "A quote is free. You only proceed if you're happy." },
                  { icon: Clock, label: '1–2 Day Response', body: 'We aim to respond to every quote request within two business days.' },
                  { icon: Phone, label: 'Direct Communication', body: 'Your preferred contact method — we come to you.' },
                ].map(({ icon: Icon, label, body }) => (
                  <div key={label} className="flex gap-3">
                    <div className="w-7 h-7 flex items-center justify-center border border-zinc-800 bg-zinc-900/40 shrink-0">
                      <Icon size={12} className="text-cyan-400" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-300">{label}</p>
                      <p className="text-[11px] text-zinc-600 leading-relaxed mt-0.5">{body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Services */}
            <div className="border border-zinc-800/50 bg-zinc-900/20 p-6">
              <h2 className="text-xs font-black text-white tracking-[0.25em] uppercase mb-4">
                Quote-Based Services
              </h2>
              <ul className="flex flex-col gap-2">
                {[
                  'Full Custom Build',
                  'Stage 3+ Tuning',
                  'Turbo / Supercharger Kit',
                  'Custom Exhaust Fabrication',
                  'Track Preparation Package',
                  'Engine Diagnostics',
                  'Suspension Setup',
                  'Aero Kit Installation',
                  'Brake Upgrade Package',
                  'ECU Tuning Consultation',
                  'Performance Inspection',
                ].map((svc) => (
                  <li key={svc} className="flex items-center gap-2 text-[11px] text-zinc-500">
                    <span className="w-1 h-1 rounded-full bg-cyan-400/40 shrink-0" aria-hidden="true" />
                    {svc}
                  </li>
                ))}
              </ul>
            </div>
            {/* WhatsApp / Call CTA */}
            {(settings.whatsappNumber || settings.contactPhone) && (() => {
              const waUrl = buildWhatsAppUrl(settings.whatsappNumber, settings.quoteWhatsAppMessage || undefined);
              const telUrl = buildTelUrl(settings.contactPhone);
              return (
                <div className="border border-zinc-800/50 bg-zinc-900/20 p-6">
                  <h2 className="text-xs font-black text-white tracking-[0.25em] uppercase mb-2">
                    Prefer to Message Us?
                  </h2>
                  <p className="text-[11px] text-zinc-500 leading-relaxed mb-4">
                    Skip the form and reach us directly on WhatsApp or by phone.
                  </p>
                  <div className="flex flex-col gap-2">
                    {waUrl && (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-contact-action="quote-whatsapp-inquiry"
                        className="flex items-center gap-2 px-4 py-3 border border-zinc-700 hover:border-cyan-400/40 text-zinc-400 hover:text-cyan-400 text-[10px] font-black tracking-[0.15em] uppercase transition-all duration-200"
                      >
                        <MessageCircle size={12} aria-hidden="true" />
                        Quote on WhatsApp
                      </a>
                    )}
                    {telUrl && (
                      <a
                        href={telUrl}
                        data-contact-action="phone-click"
                        className="flex items-center gap-2 px-4 py-3 border border-zinc-700 hover:border-cyan-400/40 text-zinc-400 hover:text-cyan-400 text-[10px] font-black tracking-[0.15em] uppercase transition-all duration-200"
                      >
                        <Phone size={12} aria-hidden="true" />
                        Call Us
                      </a>
                    )}
                  </div>
                </div>
              );
            })()}
          </aside>
        </div>
      </div>
    </div>
  );
}
