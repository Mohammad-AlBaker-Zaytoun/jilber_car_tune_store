import type { Metadata } from 'next';
import { getSettings } from '@/lib/settings.dev';
import { siteConfig } from '@/lib/seo/site-config';
import { buildWhatsAppUrl, buildTelUrl, buildMailtoUrl } from '@/lib/contact';
import { safeJsonLd } from '@/lib/seo/helpers';
import { Phone, MessageCircle, Mail, MapPin, Clock, ExternalLink, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Contact our performance tuning workshop for ECU tuning, exhaust systems, suspension upgrades, diagnostics, and custom automotive builds.',
};

export default async function ContactPage() {
  const s = await getSettings();

  const waUrl = buildWhatsAppUrl(s.whatsappNumber, s.defaultWhatsAppMessage || undefined);
  const telUrl = buildTelUrl(s.contactPhone);
  const mailUrl = buildMailtoUrl(s.contactEmail);
  const safeGoogleMapsUrl =
    s.googleMapsUrl &&
    (s.googleMapsUrl.startsWith('https://') || s.googleMapsUrl.startsWith('http://'))
      ? s.googleMapsUrl
      : null;

  const hasAnyContact = s.contactPhone || s.contactEmail || s.whatsappNumber || s.address;

  // JSON-LD LocalBusiness structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AutoRepair',
    name: siteConfig.businessName,
    url: siteConfig.siteUrl,
    ...(s.contactPhone ? { telephone: s.contactPhone } : {}),
    ...(s.contactEmail ? { email: s.contactEmail } : {}),
    ...(s.address
      ? {
          address: {
            '@type': 'PostalAddress',
            streetAddress: s.address,
          },
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />

      <div className="bg-zinc-950 pt-28 lg:pt-32 pb-20 lg:pb-28 min-h-screen">
        {/* Hero */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8 mb-16">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase font-semibold mb-8">
            <Link href="/" className="text-zinc-600 hover:text-cyan-400 transition-colors">Home</Link>
            <ChevronRight size={10} className="text-zinc-700" />
            <span className="text-zinc-500">Contact</span>
          </nav>

          <div className="inline-flex items-center gap-2.5 mb-5">
            <div className="w-7 h-px bg-cyan-400 shrink-0" aria-hidden="true" />
            <span className="text-[10px] text-cyan-400 tracking-[0.3em] uppercase font-bold">
              Reach Out
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none mb-6">
            GET IN<br />
            <span className="text-cyan-400">TOUCH</span>
          </h1>
          <p className="text-base text-zinc-400 leading-relaxed max-w-2xl">
            Whether you have a question about a service, need a custom quote, or just want to
            talk performance — we&apos;re here to help. Choose the channel that works best for you.
          </p>
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

            {/* ── Left: Contact cards ── */}
            <div className="flex flex-col gap-4">
              {hasAnyContact ? (
                <>
                  {/* Phone */}
                  {s.contactPhone && (
                    <div className="border border-zinc-800/50 bg-zinc-900/20 p-6 flex items-start gap-5">
                      <div className="w-10 h-10 shrink-0 flex items-center justify-center border border-zinc-700/50 bg-zinc-900">
                        <Phone className="text-cyan-400" size={18} aria-hidden="true" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-zinc-500 tracking-[0.2em] uppercase font-bold mb-1">Phone</p>
                        {telUrl ? (
                          <a
                            href={telUrl}
                            data-contact-action="phone-click"
                            className="text-base font-black text-white hover:text-cyan-400 transition-colors block"
                          >
                            {s.contactPhone}
                          </a>
                        ) : (
                          <p className="text-base font-black text-white">{s.contactPhone}</p>
                        )}
                        {s.workingHours && (
                          <p className="text-xs text-zinc-500 mt-1">{s.workingHours}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* WhatsApp */}
                  {waUrl && (
                    <div className="border border-zinc-800/50 bg-zinc-900/20 p-6 flex items-start gap-5">
                      <div className="w-10 h-10 shrink-0 flex items-center justify-center border border-zinc-700/50 bg-zinc-900">
                        <MessageCircle className="text-cyan-400" size={18} aria-hidden="true" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-zinc-500 tracking-[0.2em] uppercase font-bold mb-1">WhatsApp</p>
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          data-contact-action="whatsapp-click"
                          className="text-base font-black text-white hover:text-cyan-400 transition-colors block"
                        >
                          Message Us on WhatsApp
                        </a>
                        <p className="text-xs text-zinc-500 mt-1">Fastest response channel</p>
                      </div>
                    </div>
                  )}

                  {/* Email */}
                  {s.contactEmail && (
                    <div className="border border-zinc-800/50 bg-zinc-900/20 p-6 flex items-start gap-5">
                      <div className="w-10 h-10 shrink-0 flex items-center justify-center border border-zinc-700/50 bg-zinc-900">
                        <Mail className="text-cyan-400" size={18} aria-hidden="true" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-zinc-500 tracking-[0.2em] uppercase font-bold mb-1">Email</p>
                        {mailUrl ? (
                          <a
                            href={mailUrl}
                            data-contact-action="email-click"
                            className="text-base font-black text-white hover:text-cyan-400 transition-colors block break-all"
                          >
                            {s.contactEmail}
                          </a>
                        ) : (
                          <p className="text-base font-black text-white break-all">{s.contactEmail}</p>
                        )}
                        <p className="text-xs text-zinc-500 mt-1">We reply within 24 hours</p>
                      </div>
                    </div>
                  )}

                  {/* Address */}
                  {s.address && (
                    <div className="border border-zinc-800/50 bg-zinc-900/20 p-6 flex items-start gap-5">
                      <div className="w-10 h-10 shrink-0 flex items-center justify-center border border-zinc-700/50 bg-zinc-900">
                        <MapPin className="text-cyan-400" size={18} aria-hidden="true" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-zinc-500 tracking-[0.2em] uppercase font-bold mb-1">Workshop</p>
                        <p className="text-base font-black text-white leading-snug">{s.address}</p>
                        {safeGoogleMapsUrl && (
                          <a
                            href={safeGoogleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 mt-2 transition-colors"
                          >
                            <ExternalLink size={11} aria-hidden="true" />
                            Get Directions on Google Maps
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Working hours */}
                  {s.workingHours && (
                    <div className="border border-zinc-800/50 bg-zinc-900/20 p-6 flex items-start gap-5">
                      <div className="w-10 h-10 shrink-0 flex items-center justify-center border border-zinc-700/50 bg-zinc-900">
                        <Clock className="text-cyan-400" size={18} aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-[10px] text-zinc-500 tracking-[0.2em] uppercase font-bold mb-1">Working Hours</p>
                        <p className="text-sm text-zinc-300 leading-relaxed">{s.workingHours}</p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="border border-zinc-800/50 bg-zinc-900/20 p-8 text-center">
                  <p className="text-sm text-zinc-500">Contact details are being updated. Please check back soon.</p>
                </div>
              )}
            </div>

            {/* ── Right: Quick actions + form link ── */}
            <div className="flex flex-col gap-6">
              {/* Quick CTA row */}
              <div className="border border-zinc-800/50 bg-zinc-900/20 p-6">
                <h2 className="text-xs font-black text-white tracking-[0.25em] uppercase mb-5">
                  Quick Actions
                </h2>
                <div className="flex flex-col gap-3">
                  {waUrl && (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-contact-action="whatsapp-click"
                      className="flex items-center gap-3 p-4 border border-zinc-700 hover:border-cyan-400/40 hover:bg-cyan-400/5 transition-all duration-200 group"
                    >
                      <div className="w-8 h-8 flex items-center justify-center border border-zinc-700 group-hover:border-cyan-400/40 bg-zinc-900">
                        <MessageCircle size={14} className="text-cyan-400" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-white group-hover:text-cyan-400 transition-colors uppercase tracking-wide">
                          Start a WhatsApp Chat
                        </p>
                        <p className="text-[10px] text-zinc-600 mt-0.5">Instant replies during working hours</p>
                      </div>
                    </a>
                  )}
                  {telUrl && (
                    <a
                      href={telUrl}
                      data-contact-action="phone-click"
                      className="flex items-center gap-3 p-4 border border-zinc-700 hover:border-cyan-400/40 hover:bg-cyan-400/5 transition-all duration-200 group"
                    >
                      <div className="w-8 h-8 flex items-center justify-center border border-zinc-700 group-hover:border-cyan-400/40 bg-zinc-900">
                        <Phone size={14} className="text-cyan-400" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-white group-hover:text-cyan-400 transition-colors uppercase tracking-wide">
                          Call Us Now
                        </p>
                        <p className="text-[10px] text-zinc-600 mt-0.5">{s.contactPhone}</p>
                      </div>
                    </a>
                  )}
                  <Link
                    href="/quote"
                    className="flex items-center gap-3 p-4 border border-zinc-700 hover:border-cyan-400/40 hover:bg-cyan-400/5 transition-all duration-200 group"
                  >
                    <div className="w-8 h-8 flex items-center justify-center border border-zinc-700 group-hover:border-cyan-400/40 bg-zinc-900">
                      <Mail size={14} className="text-cyan-400" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-white group-hover:text-cyan-400 transition-colors uppercase tracking-wide">
                        Request a Quote
                      </p>
                      <p className="text-[10px] text-zinc-600 mt-0.5">Tailored pricing for your build</p>
                    </div>
                  </Link>
                  <Link
                    href="/#contact"
                    className="flex items-center gap-3 p-4 border border-zinc-700 hover:border-cyan-400/40 hover:bg-cyan-400/5 transition-all duration-200 group"
                  >
                    <div className="w-8 h-8 flex items-center justify-center border border-zinc-700 group-hover:border-cyan-400/40 bg-zinc-900">
                      <ChevronRight size={14} className="text-cyan-400" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-white group-hover:text-cyan-400 transition-colors uppercase tracking-wide">
                        Book a Consultation
                      </p>
                      <p className="text-[10px] text-zinc-600 mt-0.5">Use the enquiry form on our home page</p>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Response time */}
              <div className="border border-zinc-800/50 bg-zinc-900/20 p-6">
                <h2 className="text-xs font-black text-white tracking-[0.25em] uppercase mb-4">
                  Response Times
                </h2>
                <div className="flex flex-col gap-3">
                  {[
                    { channel: 'WhatsApp', time: 'Within the hour', available: !!waUrl },
                    { channel: 'Phone', time: 'Immediate during working hours', available: !!telUrl },
                    { channel: 'Email', time: 'Within 24 hours', available: !!s.contactEmail },
                    { channel: 'Quote Request Form', time: '1–2 business days', available: true },
                  ]
                    .filter((r) => r.available)
                    .map(({ channel, time }) => (
                      <div key={channel} className="flex items-center justify-between text-xs gap-4">
                        <span className="text-zinc-500">{channel}</span>
                        <span className="text-zinc-300 font-semibold text-right">{time}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
