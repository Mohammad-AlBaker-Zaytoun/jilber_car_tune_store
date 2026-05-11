'use client';

import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import ScrollFrameSequence from '@/components/ScrollFrameSequence';

const FRAME_COUNT = 96;
// Adjust this value to change animation speed: lower = faster, higher = slower
const SCROLL_HEIGHT = '300vh';

function framePath(index: number): string {
  return `/store-hero-frames/frame_${String(index + 1).padStart(4, '0')}.webp`;
}

export default function StoreScrollHero() {
  return (
    <ScrollFrameSequence
      frameCount={FRAME_COUNT}
      framePath={framePath}
      scrollHeight={SCROLL_HEIGHT}
    >
      {/* Vertical vignette — dark top (navbar) + dark bottom (into products) */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.88) 100%)',
        }}
      />
      {/* Left-side vignette keeps text legible on any frame */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(105deg, rgba(0,0,0,0.70) 0%, rgba(0,0,0,0.0) 55%)',
        }}
      />

      {/* ── Overlay content ── */}
      <div className="absolute inset-0 flex flex-col px-6 sm:px-10 lg:px-16 xl:px-24 pt-24 lg:pt-28 pb-10 lg:pb-14">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="text-[10px] text-zinc-500 hover:text-cyan-400 tracking-[0.2em] uppercase font-semibold transition-colors"
          >
            Home
          </Link>
          <span className="text-zinc-700 text-[10px]">/</span>
          <span className="text-[10px] text-zinc-400 tracking-[0.2em] uppercase font-semibold">
            Store
          </span>
        </div>

        {/* Main hero content — anchored to bottom of viewport */}
        <div className="mt-auto">
          <div className="inline-flex items-center gap-2.5 mb-5">
            <div className="w-7 h-px bg-cyan-400 shrink-0" aria-hidden="true" />
            <span className="text-[10px] sm:text-xs text-cyan-400 tracking-[0.3em] uppercase font-bold">
              Performance Hardware
            </span>
            <div className="w-7 h-px bg-cyan-400 shrink-0" aria-hidden="true" />
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-none mb-4">
            THE
            <br />
            <span className="text-cyan-400">WORKSHOP</span>
            <br />
            STORE
          </h1>

          <p className="text-zinc-400 text-sm lg:text-base max-w-sm leading-relaxed">
            Precision tuning, performance hardware, and expert diagnostics
            for drivers who demand more power, sharper response, and a
            cleaner build.
          </p>

          <div className="flex items-center gap-2 text-zinc-500/70 mt-6">
            <ChevronDown className="w-4 h-4 animate-bounce" aria-hidden="true" />
            <span className="text-[10px] tracking-[0.25em] uppercase font-medium">
              Scroll to shop
            </span>
          </div>
        </div>
      </div>
    </ScrollFrameSequence>
  );
}
