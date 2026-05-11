'use client';

import { ChevronDown, Zap, Settings2, TrendingUp } from 'lucide-react';
import ScrollFrameSequence from '@/components/ScrollFrameSequence';

const TOTAL_FRAMES = 241;
const SCROLL_HEIGHT = '720vh';

function getFrameUrl(index: number): string {
  return `/scroll-frames/frame_${String(index + 1).padStart(4, '0')}.jpg`;
}

const QUICK_TAGS = [
  { Icon: Zap, label: 'ECU Tuning' },
  { Icon: Settings2, label: 'Custom Exhaust' },
  { Icon: TrendingUp, label: 'Suspension' },
] as const;

export default function ScrollFrameHero() {
  return (
    <ScrollFrameSequence
      frameCount={TOTAL_FRAMES}
      framePath={getFrameUrl}
      scrollHeight={SCROLL_HEIGHT}
    >
      {/* Bottom + top vignette */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.05) 45%, rgba(0,0,0,0.82) 100%)',
        }}
      />
      {/* Left-side vignette keeps text legible on any frame */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(105deg, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.0) 52%)',
        }}
      />

      {/* ── Hero content ── */}
      <div className="absolute inset-0 flex flex-col justify-between px-6 sm:px-10 lg:px-16 xl:px-24 pt-24 lg:pt-28 pb-10 lg:pb-14">

        {/* Upper block: badge · headline · body · CTAs */}
        <div className="max-w-3xl">
          {/* Live-status badge */}
          <div className="inline-flex items-center gap-2.5 px-3 py-1.5 border border-cyan-400/25 bg-cyan-400/5 mb-6">
            <span
              className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"
              aria-hidden="true"
            />
            <span className="text-[10px] sm:text-xs text-cyan-400 tracking-[0.35em] uppercase font-bold">
              Precision Performance Engineering
            </span>
          </div>

          {/* Headline — smaller on mobile to avoid overflow */}
          <h1 className="text-[2.5rem] sm:text-6xl lg:text-7xl xl:text-8xl font-black text-white leading-none tracking-tight mb-5 lg:mb-6">
            ENGINEER
            <br />
            <span className="text-cyan-400">YOUR DRIVE</span>
          </h1>

          <p className="text-sm sm:text-base lg:text-lg text-zinc-300/90 max-w-lg leading-relaxed mb-8 lg:mb-10">
            From precision ECU remaps to full race builds — we extract every
            ounce of performance with certified expertise and cutting-edge
            diagnostics.
          </p>

          {/* CTAs: stacked full-width on mobile, inline on sm+ */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <a
              href="#contact"
              className="w-full sm:w-auto px-6 py-4 sm:px-8 bg-cyan-400 hover:bg-cyan-300 text-black font-black text-xs sm:text-sm tracking-[0.2em] uppercase text-center transition-all duration-200 hover:shadow-[0_0_35px_rgba(0,212,255,0.6)]"
            >
              Book a Consultation
            </a>
            <a
              href="#services"
              className="w-full sm:w-auto px-6 py-4 sm:px-8 border border-white/20 hover:border-cyan-400/50 text-white hover:text-cyan-400 font-semibold text-xs sm:text-sm tracking-[0.2em] uppercase text-center transition-all duration-200 backdrop-blur-sm bg-black/20"
            >
              Explore Services
            </a>
          </div>
        </div>

        {/* Lower block: service tags + scroll nudge */}
        <div>
          <div className="flex flex-wrap gap-2 sm:gap-3 mb-5">
            {QUICK_TAGS.map(({ Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 px-3 py-2 bg-black/40 backdrop-blur-sm border border-white/10"
              >
                <Icon
                  className="w-3.5 h-3.5 text-cyan-400 shrink-0"
                  aria-hidden="true"
                />
                <span className="text-[10px] sm:text-xs text-zinc-300 tracking-[0.2em] uppercase font-semibold">
                  {label}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 text-zinc-500/70">
            <ChevronDown
              className="w-4 h-4 animate-bounce"
              aria-hidden="true"
            />
            <span className="text-[10px] tracking-[0.25em] uppercase font-medium">
              Scroll to explore
            </span>
          </div>
        </div>
      </div>
    </ScrollFrameSequence>
  );
}
