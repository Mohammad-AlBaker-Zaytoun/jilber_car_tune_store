// Removed the unused `large` field from all build entries
const BUILDS = [
  {
    id: 1,
    code: 'BLD-001',
    make: 'BMW M3',
    model: 'Competition xDrive',
    year: '2023',
    stage: 'Stage 3',
    power: '622 WHP',
    mods: ['S58 ECU Remap', 'Full Titanium Exhaust', 'Öhlins Coilover Kit'],
    bgStyle: {
      background: 'linear-gradient(135deg, #0c1a2e 0%, #0d1117 50%, #060a10 100%)',
    },
    accentColor: '#00d4ff',
  },
  {
    id: 2,
    code: 'BLD-002',
    make: 'Porsche',
    model: '911 GT3 RS',
    year: '2022',
    stage: 'Track Build',
    power: '525 WHP',
    mods: ['Aero Package', 'Öhlins DFV Suspension', 'Big Brake Kit'],
    bgStyle: {
      background: 'linear-gradient(135deg, #1a1006 0%, #110d03 50%, #070500 100%)',
    },
    accentColor: '#fbbf24',
  },
  {
    id: 3,
    code: 'BLD-003',
    make: 'Toyota',
    model: 'GR Supra A90',
    year: '2021',
    stage: 'Stage 3',
    power: '710 WHP',
    mods: ['B58 Forged Rebuild', 'Custom Turbo Kit', 'Full Exhaust'],
    bgStyle: {
      background: 'linear-gradient(135deg, #0a1206 0%, #080e04 50%, #040701 100%)',
    },
    accentColor: '#4ade80',
  },
  {
    id: 4,
    code: 'BLD-004',
    make: 'Audi',
    model: 'RS6 Avant',
    year: '2023',
    stage: 'Stage 1',
    power: '680 WHP',
    mods: ['TFSI ECU Remap', 'Downpipe Upgrade', 'Air Intake'],
    bgStyle: {
      background: 'linear-gradient(135deg, #160818 0%, #0e0510 50%, #070309 100%)',
    },
    accentColor: '#c084fc',
  },
  {
    id: 5,
    code: 'BLD-005',
    make: 'Subaru',
    model: 'WRX STI S209',
    year: '2019',
    stage: 'Rally Build',
    power: '430 WHP',
    mods: ['EJ25 Forged Internals', 'Cosworth ECU', 'STI Rally Cage'],
    bgStyle: {
      background: 'linear-gradient(135deg, #06121a 0%, #040d14 50%, #010608 100%)',
    },
    accentColor: '#38bdf8',
  },
  {
    id: 6,
    code: 'BLD-006',
    make: 'Mercedes-AMG',
    model: 'C63 S Coupé',
    year: '2022',
    stage: 'Stage 2',
    power: '590 WHP',
    mods: ['M177 Remap', 'Valved Exhaust', 'Lowering Springs'],
    bgStyle: {
      background: 'linear-gradient(135deg, #150a06 0%, #0e0603 50%, #090300 100%)',
    },
    accentColor: '#fb923c',
  },
] as const;

export default function GallerySection() {
  return (
    <section id="gallery" className="relative py-24 lg:py-32 bg-black">
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 100% 0%, rgba(0,212,255,0.04), transparent)',
        }}
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Two-column header: heading left, subtitle right — mirrors WhyChooseUs */}
        <div className="mb-14 lg:mb-20 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2.5 mb-5">
              <div className="w-7 h-px bg-cyan-400 shrink-0" aria-hidden="true" />
              <span className="text-[10px] sm:text-xs text-cyan-400 tracking-[0.3em] uppercase font-bold">
                Featured Work
              </span>
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none">
              BUILD
              <br />
              SHOWCASE
            </h2>
          </div>
          <p className="text-zinc-400 text-sm lg:text-base max-w-sm leading-relaxed sm:text-right">
            A selection of builds from our workshop. Each one engineered with
            precision and proven on the dyno.
          </p>
        </div>

        {/* Build grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {BUILDS.map(({ id, code, make, model, year, stage, power, mods, bgStyle, accentColor }) => (
            <div
              key={id}
              className="group relative overflow-hidden border border-zinc-800/50 hover:border-zinc-700/80 transition-all duration-500 cursor-pointer"
              style={bgStyle}
            >
              {/* Large decorative build number */}
              <div
                aria-hidden="true"
                className="absolute top-4 right-4 text-7xl font-black opacity-[0.06] select-none pointer-events-none leading-none"
                style={{ color: accentColor }}
              >
                {id.toString().padStart(2, '0')}
              </div>

              {/* Bottom-up gradient for readability */}
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-transparent pointer-events-none"
              />

              <div className="relative p-6 flex flex-col min-h-65 justify-between">
                {/* Top: code + stage badge */}
                <div className="flex items-start justify-between">
                  <span className="text-[9px] text-zinc-600 tracking-[0.3em] uppercase font-mono">
                    {code}
                  </span>
                  <span
                    className="inline-block px-2 py-1 text-[9px] font-black tracking-[0.2em] uppercase"
                    style={{
                      color: accentColor,
                      border: `1px solid ${accentColor}33`,
                      background: `${accentColor}0d`,
                    }}
                  >
                    {stage}
                  </span>
                </div>

                {/* Bottom: car info */}
                <div>
                  <p className="text-[10px] text-zinc-500 tracking-widest uppercase font-semibold mb-0.5">
                    {year}
                  </p>
                  <h3 className="text-lg font-black text-white leading-tight">
                    {make}
                  </h3>
                  <p className="text-xs text-zinc-400 font-medium mb-3">{model}</p>

                  <div
                    className="text-2xl font-black mb-3 tracking-tight"
                    style={{ color: accentColor }}
                  >
                    {power}
                  </div>

                  <ul className="flex flex-col gap-1">
                    {mods.map((mod) => (
                      <li
                        key={mod}
                        className="flex items-center gap-1.5 text-[10px] text-zinc-500 tracking-wide"
                      >
                        <span
                          className="w-1 h-1 rounded-full shrink-0"
                          style={{ background: accentColor }}
                          aria-hidden="true"
                        />
                        {mod}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Hover bottom accent line */}
              <div
                aria-hidden="true"
                className="absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: `linear-gradient(to right, transparent, ${accentColor}80, transparent)`,
                }}
              />
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <a
            href="#contact"
            className="inline-flex items-center gap-3 px-8 py-4 border border-zinc-700 hover:border-cyan-400/40 text-zinc-300 hover:text-cyan-400 text-xs font-black tracking-[0.2em] uppercase transition-all duration-200"
          >
            Discuss Your Build
          </a>
        </div>
      </div>
    </section>
  );
}
