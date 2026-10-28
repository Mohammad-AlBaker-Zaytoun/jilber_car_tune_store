import { Check, Star } from 'lucide-react';
import SectionHeader from '@/components/SectionHeader';

/**
 * The four build levels, as specified by the shop.
 *
 * No prices: they vary per vehicle, so every card sends the visitor to the
 * contact section instead of quoting a figure the workshop would have to walk
 * back.
 */
const PACKAGES = [
  {
    name: 'Stage 1',
    subtitle: 'Engine & Transmission Tune',
    highlight: false,
    popular: false,
    features: [
      'Engine and transmission tune',
      'Calibrated to whatever fuel the car will be using',
      'Single fuel mode or flexfuel',
    ],
  },
  {
    name: 'Stage 2',
    subtitle: 'Hardware & Software',
    highlight: true,
    popular: true,
    features: [
      'Custom engine and transmission Stage 2 software',
      'Cold air intake',
      'Downpipe',
      'Intercooler',
    ],
  },
  {
    name: 'Stage 2+',
    subtitle: 'Stage 2 With Injection',
    highlight: false,
    popular: false,
    features: [
      'Custom engine and transmission Stage 2 software',
      'Cold air intake',
      'Downpipe',
      'Intercooler',
      'Methanol injection and/or port injection',
    ],
  },
  {
    name: 'Stage 3',
    subtitle: 'Upgraded Turbos',
    highlight: false,
    popular: false,
    features: [
      'Upgraded turbos',
      'Cold air intake',
      'Downpipe',
      'Intercooler',
      'Meth injection',
      'Custom Stage 3 engine and transmission tune',
      'Methanol injection and/or port injection',
    ],
  },
];

export default function PackagesSection() {
  return (
    <section id="packages" className="relative py-24 lg:py-32 bg-black">
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% 100%, rgba(0,212,255,0.03), transparent)',
        }}
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <SectionHeader
          tag="Performance Packages"
          heading="BUILD LEVELS"
          sub="Choose the level of performance that fits your goals and your car."
          align="center"
          className="mb-14 lg:mb-20"
        />

        {/* The highlighted card used to carry md:scale-[1.03]. With three columns
            it was always the middle one, so the extra 3% grew into the gaps. As the
            second of four it lands in the right-hand column at the 2-column
            breakpoints, where it overflowed the grid by 5–7px — caught by the
            responsive audit at 768px and 1024px. The border and glow already mark
            it out. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 lg:gap-6 items-start">
          {PACKAGES.map(({ name, subtitle, highlight, popular, features }) => (
            <div
              key={name}
              className={`relative flex flex-col p-7 lg:p-8 border transition-all duration-300 ${
                highlight
                  ? 'bg-zinc-900 border-cyan-400/35 shadow-[0_0_50px_rgba(0,212,255,0.10)]'
                  : 'bg-zinc-950 border-zinc-800/60 hover:border-zinc-700'
              }`}
            >
              {popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-1.5 px-4 py-1 bg-cyan-400 text-black text-[10px] font-black tracking-[0.2em] uppercase whitespace-nowrap">
                    <Star className="w-2.5 h-2.5 fill-black" aria-hidden="true" />
                    Most Popular
                  </div>
                </div>
              )}

              <div className="mb-7">
                <p
                  className={`text-[10px] font-bold tracking-[0.25em] uppercase mb-1.5 ${
                    highlight ? 'text-cyan-400' : 'text-zinc-500'
                  }`}
                >
                  {subtitle}
                </p>
                <h3 className="text-3xl font-black text-white tracking-tight">
                  {name}
                </h3>
              </div>

              <ul className="flex-1 space-y-3 mb-8">
                {features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check
                      className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                        highlight ? 'text-cyan-400' : 'text-zinc-600'
                      }`}
                      aria-hidden="true"
                    />
                    <span className="text-sm text-zinc-400 leading-snug">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <a
                href="#contact"
                className={`block py-3.5 text-xs font-black tracking-[0.2em] uppercase text-center transition-all duration-200 ${
                  highlight
                    ? 'bg-cyan-400 text-black hover:bg-cyan-300 hover:shadow-[0_0_24px_rgba(0,212,255,0.5)]'
                    : 'border border-zinc-700 text-zinc-300 hover:border-cyan-400/40 hover:text-cyan-400'
                }`}
              >
                Contact Us For Pricing
              </a>

              {highlight && (
                <div
                  aria-hidden="true"
                  className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-cyan-400/50 to-transparent"
                />
              )}
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-zinc-500 mt-10 tracking-wider">
          For prices and more questions please{' '}
          <a
            href="#contact"
            className="text-cyan-400 font-bold hover:text-cyan-300 underline underline-offset-4 transition-colors"
          >
            contact us
          </a>
          .
        </p>
      </div>
    </section>
  );
}
