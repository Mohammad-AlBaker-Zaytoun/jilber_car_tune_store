import { Check, Star } from 'lucide-react';
import SectionHeader from '@/components/SectionHeader';

const PACKAGES = [
  {
    name: 'Stage 1',
    subtitle: 'Street Performance',
    price: 'From $1,200',
    highlight: false,
    popular: false,
    features: [
      'ECU remap & custom map file',
      'Air intake upgrade',
      'Performance intercooler',
      'Dyno session & full report',
      'Before / after power figures',
      '12-month software warranty',
    ],
    cta: 'Get Stage 1',
  },
  {
    name: 'Stage 2',
    subtitle: 'Track-Ready',
    price: 'From $3,500',
    highlight: true,
    popular: true,
    features: [
      'Everything in Stage 1',
      'Custom cat-back exhaust',
      'Upgraded turbo or injectors',
      'Coilover suspension install',
      'Corner balance & alignment',
      'Full diagnostics deep-dive',
      'Priority workshop access',
    ],
    cta: 'Get Stage 2',
  },
  {
    name: 'Stage 3',
    subtitle: 'Full Race Build',
    price: 'Custom Quote',
    highlight: false,
    popular: false,
    features: [
      'Everything in Stage 2',
      'Forged internals rebuild',
      'Big brake kit & pads',
      'Aero package & splitter',
      'Cage fabrication / harness bar',
      'Livery consultation',
      'Dedicated build manager',
      'Post-build track day',
    ],
    cta: 'Get a Quote',
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
          sub="Choose the level of performance that fits your goals, timeline, and budget."
          align="center"
          className="mb-14 lg:mb-20"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 items-start">
          {PACKAGES.map(({ name, subtitle, price, highlight, popular, features, cta }) => (
            <div
              key={name}
              className={`relative flex flex-col p-7 lg:p-8 border transition-all duration-300 ${
                highlight
                  ? 'bg-zinc-900 border-cyan-400/35 shadow-[0_0_50px_rgba(0,212,255,0.10)] md:scale-[1.03]'
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
                <p className="mt-4 text-2xl font-black text-white">{price}</p>
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
                {cta}
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

        <p className="text-center text-xs text-zinc-600 mt-10 tracking-wider">
          All packages include consultation, build planning, and post-service
          report. Pricing varies by vehicle.
        </p>
      </div>
    </section>
  );
}
