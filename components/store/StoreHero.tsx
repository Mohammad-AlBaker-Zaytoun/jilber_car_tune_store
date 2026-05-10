import Link from 'next/link';

export default function StoreHero() {
  return (
    <section className="relative pt-32 pb-16 lg:pt-40 lg:pb-20 bg-black overflow-hidden">
      {/* Background glow */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,212,255,0.06), transparent)',
        }}
      />

      {/* Grid texture */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-8">
          <Link
            href="/"
            className="text-[10px] text-zinc-600 hover:text-cyan-400 tracking-[0.2em] uppercase font-semibold transition-colors"
          >
            Home
          </Link>
          <span className="text-zinc-700 text-[10px]">/</span>
          <span className="text-[10px] text-zinc-500 tracking-[0.2em] uppercase font-semibold">
            Store
          </span>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
          <div>
            <div className="inline-flex items-center gap-2.5 mb-5">
              <div className="w-7 h-px bg-cyan-400 shrink-0" aria-hidden="true" />
              <span className="text-[10px] sm:text-xs text-cyan-400 tracking-[0.3em] uppercase font-bold">
                Performance Hardware
              </span>
              <div className="w-7 h-px bg-cyan-400 shrink-0" aria-hidden="true" />
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-none">
              THE
              <br />
              <span className="text-cyan-400">WORKSHOP</span>
              <br />
              STORE
            </h1>
          </div>
          <p className="text-zinc-400 text-sm lg:text-base max-w-sm leading-relaxed lg:text-right">
            Precision tuning, performance hardware, and expert diagnostics
            for drivers who demand more power, sharper response, and a
            cleaner build.
          </p>
        </div>
      </div>
    </section>
  );
}
