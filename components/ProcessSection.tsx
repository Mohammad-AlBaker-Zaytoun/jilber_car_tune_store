import SectionHeader from '@/components/SectionHeader';

const STEPS = [
  {
    num: '01',
    title: 'Consultation',
    description:
      'We start with a detailed conversation about your goals, usage, and budget. Whether you want a street tune or a full track build, we map out the right path.',
    detail: '30–60 min session',
  },
  {
    num: '02',
    title: 'Diagnostics',
    description:
      'Your vehicle undergoes a comprehensive health scan using our Bosch KTS diagnostic platform — identifying any issues before modifications begin.',
    detail: 'Full ECU scan',
  },
  {
    num: '03',
    title: 'Build Plan',
    description:
      'We deliver a detailed build specification with parts list, lead times, and a fixed-price quote. No hidden costs, no surprises.',
    detail: 'Itemised quote',
  },
  {
    num: '04',
    title: 'Engineering',
    description:
      'Your car enters the workshop. Modifications are carried out by certified technicians with meticulous attention to OEM fit and finish standards.',
    detail: 'Workshop time',
  },
  {
    num: '05',
    title: 'Dyno & QA',
    description:
      'Every build finishes with dyno verification. We log before and after figures, refine the map, and issue a full performance report.',
    detail: 'Data-verified',
  },
  {
    num: '06',
    title: 'Handover',
    description:
      'We walk you through every modification, show you the dyno sheet, and answer every question. Your build file stays on record for future work.',
    detail: 'Full documentation',
  },
] as const;

export default function ProcessSection() {
  return (
    <section id="process" className="relative py-24 lg:py-32 bg-zinc-950">
      {/* Subtle engineering-grid texture */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative">
        <SectionHeader
          tag="How It Works"
          heading="THE PROCESS"
          sub="Six structured steps from first contact to final handover. No guesswork, no shortcuts."
          align="center"
          className="mb-14 lg:mb-20"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
          {STEPS.map(({ num, title, description, detail }) => (
            <div
              key={num}
              className="group relative p-6 lg:p-7 border border-zinc-800/50 hover:border-zinc-700/80 bg-zinc-900/20 hover:bg-zinc-900/40 transition-all duration-300"
            >
              {/* Large decorative step number */}
              <div
                aria-hidden="true"
                className="font-mono text-6xl font-black text-zinc-800/60 group-hover:text-zinc-700/50 leading-none mb-4 transition-colors duration-300 select-none"
              >
                {num}
              </div>

              <h3 className="text-sm font-black text-white uppercase tracking-widest mb-2.5">
                {title}
              </h3>

              <p className="text-sm text-zinc-500 leading-relaxed mb-5">
                {description}
              </p>

              <div className="flex items-center gap-2">
                <span
                  className="w-1 h-1 rounded-full bg-cyan-400/50"
                  aria-hidden="true"
                />
                <span className="text-[10px] text-cyan-400/60 tracking-[0.25em] uppercase font-bold">
                  {detail}
                </span>
              </div>

              {/* Hover left accent bar */}
              <div
                aria-hidden="true"
                className="absolute top-0 left-0 bottom-0 w-px bg-cyan-400/0 group-hover:bg-cyan-400/40 transition-all duration-300"
              />
            </div>
          ))}
        </div>

        {/* Inline CTA banner */}
        <div className="mt-14 lg:mt-20 border border-zinc-800/50 p-8 lg:p-12 bg-zinc-900/20 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl lg:text-2xl font-black text-white mb-1.5">
              Ready to start your build?
            </h3>
            <p className="text-sm text-zinc-500">
              Book a consultation and we will walk you through every step.
            </p>
          </div>
          <a
            href="#contact"
            className="shrink-0 px-8 py-4 bg-cyan-400 hover:bg-cyan-300 text-black font-black text-xs tracking-[0.2em] uppercase transition-all duration-200 hover:shadow-[0_0_30px_rgba(0,212,255,0.5)]"
          >
            Get Started
          </a>
        </div>
      </div>
    </section>
  );
}
