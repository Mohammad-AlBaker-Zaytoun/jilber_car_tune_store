'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, Zap, Settings2, TrendingUp } from 'lucide-react';

const TOTAL_FRAMES = 241;
const SCROLL_HEIGHT_VH = 720;

function getFrameUrl(index: number): string {
  return `/scroll-frames/frame_${String(index + 1).padStart(4, '0')}.jpg`;
}

const QUICK_TAGS = [
  { Icon: Zap, label: 'ECU Tuning' },
  { Icon: Settings2, label: 'Custom Exhaust' },
  { Icon: TrendingUp, label: 'Suspension' },
] as const;

export default function ScrollFrameHero() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Cache the 2D context — avoids repeated getContext() calls on every frame draw
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const imagesRef = useRef<(HTMLImageElement | null)[]>(
    Array.from({ length: TOTAL_FRAMES }, () => null)
  );
  const currentFrameRef = useRef(0);
  const rafIdRef = useRef(0);

  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);

  // Draw a frame using cached context and cover-scaling
  const drawFrame = useCallback((index: number) => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    const img = imagesRef.current[index];
    if (!canvas || !ctx || !img || !img.complete || img.naturalWidth === 0) return;

    const { width: cW, height: cH } = canvas;
    const { naturalWidth: iW, naturalHeight: iH } = img;
    const scale = Math.max(cW / iW, cH / iH);
    const dW = iW * scale;
    const dH = iH * scale;

    ctx.clearRect(0, 0, cW, cH);
    ctx.drawImage(img, (cW - dW) / 2, (cH - dH) / 2, dW, dH);
  }, []); // intentionally empty — only touches refs

  // Match canvas bitmap to its rendered size; re-acquire context after each resize
  // (canvas state resets when width/height attributes change)
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;

      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctxRef.current = ctx;
      }

      drawFrame(currentFrameRef.current);
    };

    resize();
    window.addEventListener('resize', resize, { passive: true });
    return () => window.removeEventListener('resize', resize);
  }, [drawFrame]);

  // Kick off preloading; hide loading screen the moment frame 0 is ready
  useEffect(() => {
    let loadedCount = 0;

    const onLoaded = (i: number) => () => {
      loadedCount++;
      setLoadProgress(Math.round((loadedCount / TOTAL_FRAMES) * 100));
      if (i === 0) {
        drawFrame(0);
        setLoading(false);
      }
    };

    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      imagesRef.current[i] = img;
      img.onload = onLoaded(i);
      img.onerror = onLoaded(i);
      img.src = getFrameUrl(i);
    }

    // Safety valve — never leave loading screen up for more than 5 s
    const fallback = setTimeout(() => setLoading(false), 5000);
    return () => clearTimeout(fallback);
  }, [drawFrame]);

  // Scroll → frame mapping via RAF (one pending RAF at a time)
  useEffect(() => {
    let pending = false;

    const onScroll = () => {
      if (pending) return;
      pending = true;
      rafIdRef.current = requestAnimationFrame(() => {
        pending = false;
        const section = sectionRef.current;
        if (!section) return;

        const rect = section.getBoundingClientRect();
        const scrollable = section.offsetHeight - window.innerHeight;
        if (scrollable <= 0) return;

        const scrolled = Math.max(0, -rect.top);
        const progress = Math.min(1, scrolled / scrollable);
        const frame = Math.min(
          TOTAL_FRAMES - 1,
          Math.floor(progress * TOTAL_FRAMES)
        );

        if (frame !== currentFrameRef.current) {
          currentFrameRef.current = frame;
          drawFrame(frame);
        }
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafIdRef.current);
    };
  }, [drawFrame]);

  return (
    <section
      ref={sectionRef}
      style={{ height: `${SCROLL_HEIGHT_VH}vh` }}
      className="relative"
    >
      {/* Sticky viewport — fills screen while outer section scrolls */}
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          aria-hidden="true"
        />

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

        {/* ── Loading overlay ──
            Kept in the DOM so it can fade out smoothly via CSS transition.
            pointer-events-none once invisible prevents blocking interaction. */}
        <div
          className={`absolute inset-0 bg-zinc-950 z-50 flex flex-col items-center justify-center transition-opacity duration-700 ${
            loading ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          aria-hidden={!loading}
        >
          <div className="flex items-center gap-3 mb-10">
            <div
              className="w-5 h-5 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin"
              aria-hidden="true"
            />
            <span className="text-lg font-black tracking-[0.35em] text-white uppercase">
              JILBER
            </span>
          </div>

          <div className="w-48 h-0.5 bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-cyan-400 transition-[width] duration-300"
              style={{ width: `${loadProgress}%` }}
              role="progressbar"
              aria-valuenow={loadProgress}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>

          <p className="text-[10px] text-zinc-600 tracking-[0.3em] uppercase mt-3">
            Loading {loadProgress}%
          </p>
        </div>
      </div>
    </section>
  );
}
