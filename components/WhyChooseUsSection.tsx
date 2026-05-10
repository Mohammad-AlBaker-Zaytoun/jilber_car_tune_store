import { Shield, Award, Users, Clock, Cpu, Wrench } from 'lucide-react';

const STATS = [
  { value: '500+', label: 'Builds Completed' },
  { value: '15+', label: 'Years Experience' },
  { value: '98%', label: 'Client Satisfaction' },
  { value: '50+', label: 'Championships Won' },
];

const REASONS = [
  {
    Icon: Shield,
    title: 'Certified Engineers',
    description:
      'Our team holds international certifications from Bosch, Garrett, and Öhlins. Every technician is factory-trained on the platforms they tune.',
  },
  {
    Icon: Cpu,
    title: 'State-of-the-Art Equipment',
    description:
      '4WD dynamometers, Bosch KTS diagnostic platforms, and laser alignment racks. Every build is data-verified before handover.',
  },
  {
    Icon: Award,
    title: 'Guaranteed Results',
    description:
      'Every tune is dyno-proven with before and after power figures. We stand behind our work with a 12-month performance guarantee.',
  },
  {
    Icon: Users,
    title: 'Dedicated Build Manager',
    description:
      'One point of contact from intake to delivery. Real-time updates, transparent communication, and zero surprises on invoicing.',
  },
  {
    Icon: Clock,
    title: 'Fast Turnaround',
    description:
      'We respect your schedule. Most Stage 1 builds are completed within 48 hours without compromising quality or verification.',
  },
  {
    Icon: Wrench,
    title: 'Post-Service Support',
    description:
      "We don't disappear after handover. Ongoing dyno checks, map refinements, and priority diagnostics keep your build performing.",
  },
];

export default function WhyChooseUsSection() {
  return (
    <section id="why-us" className="relative py-24 lg:py-32 bg-zinc-950">
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 0% 100%, rgba(0,212,255,0.04), transparent)',
        }}
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Stats bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-zinc-800/40 mb-20 lg:mb-24 overflow-hidden">
          {STATS.map(({ value, label }) => (
            <div
              key={label}
              className="flex flex-col items-center justify-center p-8 lg:p-10 bg-zinc-950 text-center"
            >
              <span className="text-4xl lg:text-5xl font-black text-cyan-400 mb-1 tracking-tight">
                {value}
              </span>
              <span className="text-[10px] text-zinc-500 tracking-[0.25em] uppercase font-semibold">
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Two-column header: heading left, subtitle right on desktop */}
        <div className="mb-14 lg:mb-16 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 lg:gap-16">
          <div className="shrink-0">
            {/* Inline tag (side-by-side layout doesn't suit SectionHeader here) */}
            <div className="inline-flex items-center gap-2.5 mb-5">
              <div className="w-7 h-px bg-cyan-400 shrink-0" aria-hidden="true" />
              <span className="text-[10px] sm:text-xs text-cyan-400 tracking-[0.3em] uppercase font-bold">
                Why JILBER
              </span>
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none">
              BUILT ON
              <br />
              PRECISION
            </h2>
          </div>
          <p className="text-zinc-400 text-base lg:text-lg max-w-md leading-relaxed lg:text-right">
            Excellence is not a goal — it is the minimum standard we hold for
            every build, every tune, every client who trusts us with their car.
          </p>
        </div>

        {/* Reasons grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
          {REASONS.map(({ Icon, title, description }) => (
            <div
              key={title}
              className="group p-6 lg:p-7 border border-zinc-800/50 hover:border-cyan-400/20 bg-zinc-900/20 hover:bg-zinc-900/40 transition-all duration-300"
            >
              <div className="w-11 h-11 mb-5 flex items-center justify-center border border-zinc-700/50 group-hover:border-cyan-400/30 bg-zinc-900 group-hover:bg-cyan-400/5 transition-all duration-300">
                <Icon
                  className="text-zinc-500 group-hover:text-cyan-400 transition-colors duration-300"
                  size={18}
                  aria-hidden="true"
                />
              </div>
              <h3 className="text-xs font-black text-white uppercase tracking-widest mb-2.5">
                {title}
              </h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
