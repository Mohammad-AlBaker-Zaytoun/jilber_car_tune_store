import {
  Zap,
  Wind,
  SlidersHorizontal,
  Activity,
  Wrench,
  Layers,
  CircleDot,
  Trophy,
} from 'lucide-react';
import SectionHeader from '@/components/SectionHeader';

const SERVICES = [
  {
    Icon: Zap,
    title: 'ECU Tuning',
    description:
      'Custom engine maps, chip tuning, and dyno-verified performance remaps tailored to your specific build goals.',
    detail: 'Up to +35% power gain',
  },
  {
    Icon: Wind,
    title: 'Exhaust Systems',
    description:
      'Full custom exhaust fabrication in titanium or stainless steel — downpipes, mid-pipes, and cat-back systems.',
    detail: 'Cat-back & full exhaust',
  },
  {
    Icon: SlidersHorizontal,
    title: 'Suspension Tuning',
    description:
      'Corner balancing, coilover setup, alignment correction, and geometry adjustments for optimal handling dynamics.',
    detail: 'Track & road setup',
  },
  {
    Icon: Activity,
    title: 'Performance Diagnostics',
    description:
      'Advanced OBD-II scanning, real-time data logging, and comprehensive system health analysis across every ECU module.',
    detail: 'Full system analysis',
  },
  {
    Icon: Wrench,
    title: 'Custom Builds',
    description:
      'End-to-end build management from concept to delivery — sourcing, fitting, tuning, and final commissioning.',
    detail: 'End-to-end builds',
  },
  {
    Icon: Layers,
    title: 'Aero Kits',
    description:
      'Carbon fiber splitters, diffusers, rear wings, and custom bodywork engineered for downforce and aerodynamic balance.',
    detail: 'Carbon & composite',
  },
  {
    Icon: CircleDot,
    title: 'Wheels & Fitment',
    description:
      'Forged wheel sourcing, stagger fitment, spacer sizing, brake caliper clearance checks, and stretch consultation.',
    detail: 'Forged & flow-formed',
  },
  {
    Icon: Trophy,
    title: 'Track Upgrades',
    description:
      'Big brake kits, roll cage fabrication, harness bars, fire suppression systems, and race-spec safety certification.',
    detail: 'Race-ready builds',
  },
];

export default function ServicesSection() {
  return (
    <section id="services" className="relative py-24 lg:py-32 bg-zinc-950">
      {/* Subtle radial accent */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 90% 10%, rgba(0,212,255,0.05), transparent)',
        }}
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <SectionHeader
          tag="What We Do"
          heading="OUR SERVICES"
          sub="Every aspect of performance, handled by specialists with one obsession — making your car faster, sharper, and more capable."
          className="mb-14 lg:mb-20"
        />

        {/* Service cards — hairline gaps create a grid-border effect */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-zinc-800/30">
          {SERVICES.map(({ Icon, title, description, detail }) => (
            <div
              key={title}
              className="group relative flex flex-col p-6 bg-zinc-950 hover:bg-zinc-900 transition-colors duration-300"
            >
              {/* Icon box */}
              <div className="w-10 h-10 mb-5 flex items-center justify-center border border-zinc-700/60 group-hover:border-cyan-400/30 bg-zinc-900 group-hover:bg-cyan-400/5 transition-all duration-300">
                <Icon
                  className="text-zinc-500 group-hover:text-cyan-400 transition-colors duration-300"
                  size={18}
                  aria-hidden="true"
                />
              </div>

              <h3 className="text-xs font-black text-white uppercase tracking-widest mb-2.5">
                {title}
              </h3>

              <p className="text-xs text-zinc-500 leading-relaxed flex-1 mb-5">
                {description}
              </p>

              <div className="flex items-center gap-2 pt-4 border-t border-zinc-800/60">
                <span
                  className="w-1 h-1 rounded-full bg-cyan-400/60"
                  aria-hidden="true"
                />
                <span className="text-[10px] text-cyan-400/70 tracking-[0.2em] uppercase font-bold">
                  {detail}
                </span>
              </div>

              {/* Hover top-border accent */}
              <div
                aria-hidden="true"
                className="absolute top-0 left-0 right-0 h-px bg-cyan-400/0 group-hover:bg-cyan-400/40 transition-all duration-300"
              />
            </div>
          ))}
        </div>

        {/* Section-end nudge */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-zinc-800/40">
          <p className="text-sm text-zinc-500">
            Not sure which service fits your build?
          </p>
          <a
            href="#contact"
            className="shrink-0 text-xs font-black text-cyan-400 hover:text-cyan-300 tracking-[0.2em] uppercase transition-colors duration-200 underline-offset-4 hover:underline"
          >
            Ask us — it&apos;s free
          </a>
        </div>
      </div>
    </section>
  );
}
