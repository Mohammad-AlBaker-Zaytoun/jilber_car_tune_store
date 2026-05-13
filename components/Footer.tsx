import { Gauge } from 'lucide-react';

const SERVICES_LINKS = [
  { label: 'ECU Tuning', href: '/#services' },
  { label: 'Exhaust Systems', href: '/#services' },
  { label: 'Suspension Tuning', href: '/#services' },
  { label: 'Performance Diagnostics', href: '/#services' },
  { label: 'Custom Builds', href: '/#services' },
  { label: 'Track Upgrades', href: '/#services' },
];

const COMPANY_LINKS = [
  { label: 'Our Process', href: '/#process' },
  { label: 'Build Packages', href: '/#packages' },
  { label: 'Why JILBER', href: '/#why-us' },
  { label: 'Gallery', href: '/#gallery' },
  { label: 'Contact Us', href: '/contact' },
  { label: 'Book Consultation', href: '/#contact' },
];

const SOCIAL_LINKS = [
  {
    label: 'Instagram',
    href: '#',
    svg: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4"
        aria-hidden="true"
      >
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    ),
  },
  {
    label: 'YouTube',
    href: '#',
    svg: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4"
        aria-hidden="true"
      >
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-1.96C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.94 1.96C5.12 20 12 20 12 20s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
        <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" />
      </svg>
    ),
  },
  {
    label: 'Facebook',
    href: '#',
    svg: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4"
        aria-hidden="true"
      >
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
  },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative bg-black border-t border-zinc-800/50">
      {/* Top accent line */}
      <div
        aria-hidden="true"
        className="h-px w-full bg-linear-to-r from-transparent via-cyan-400/30 to-transparent"
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-20">
        {/* Main grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-12 lg:gap-8">
          {/* Brand */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-1">
            <a href="/" className="flex items-center gap-2.5 mb-6 group w-fit">
              <div className="w-9 h-9 flex items-center justify-center border border-cyan-400/30 bg-cyan-400/5 group-hover:bg-cyan-400/10 transition-colors">
                <Gauge
                  className="w-5 h-5 text-cyan-400 group-hover:rotate-45 transition-transform duration-500"
                  aria-hidden="true"
                />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-base font-black tracking-[0.25em] text-white uppercase">
                  JILBER
                </span>
                <span className="text-[9px] text-cyan-400/60 tracking-[0.2em] font-medium uppercase">
                  Performance
                </span>
              </div>
            </a>

            <p className="text-sm text-zinc-500 leading-relaxed max-w-xs mb-6">
              Certified performance engineering for drivers who demand more.
              Precision-built. Dyno-verified. Track-tested.
            </p>

            {/* Social */}
            <div className="flex items-center gap-3">
              {SOCIAL_LINKS.map(({ label, href, svg }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 flex items-center justify-center border border-zinc-800 hover:border-cyan-400/40 text-zinc-500 hover:text-cyan-400 transition-all duration-200 bg-zinc-900/40 hover:bg-cyan-400/5"
                >
                  {svg}
                </a>
              ))}
            </div>
          </div>

          {/* Services links */}
          <div>
            <h4 className="text-[10px] font-black text-white tracking-[0.25em] uppercase mb-5">
              Services
            </h4>
            <ul className="flex flex-col gap-2.5">
              {SERVICES_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    className="text-sm text-zinc-500 hover:text-cyan-400 transition-colors duration-200"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h4 className="text-[10px] font-black text-white tracking-[0.25em] uppercase mb-5">
              Company
            </h4>
            <ul className="flex flex-col gap-2.5">
              {COMPANY_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    className="text-sm text-zinc-500 hover:text-cyan-400 transition-colors duration-200"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Certifications / trust */}
          <div>
            <h4 className="text-[10px] font-black text-white tracking-[0.25em] uppercase mb-5">
              Certified By
            </h4>
            <ul className="flex flex-col gap-3">
              {[
                'Bosch Automotive',
                'Garrett Advancing Motion',
                'Öhlins Racing',
                'CAMS Licensed',
                'ISO 9001:2015',
              ].map((cert) => (
                <li key={cert} className="flex items-center gap-2">
                  <span
                    className="w-1 h-1 rounded-full bg-cyan-400/50 shrink-0"
                    aria-hidden="true"
                  />
                  <span className="text-xs text-zinc-600">{cert}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-14 lg:mt-16 pt-7 border-t border-zinc-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-600">
            &copy; {year} JILBER Performance Engineering. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            {[
              { label: 'Privacy Policy', href: '/privacy-policy' },
              { label: 'Terms of Service', href: '/terms-of-service' },
              { label: 'Cookie Policy', href: '/cookie-policy' },
            ].map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
