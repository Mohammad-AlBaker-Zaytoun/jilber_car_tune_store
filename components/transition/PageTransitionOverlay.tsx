'use client';

import { useEffect, useRef } from 'react';
import {
  PAGE_TRANSITION_DURATION_MS,
  PAGE_TRANSITION_FRAME_COUNT,
  type TransitionPhase,
} from './PageTransitionProvider';

// ─── Helpers ────────────────────────────────────────────────────────────────

function drawFrameCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cssW: number,
  cssH: number
) {
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  if (!iw || !ih) return;
  const scale = Math.max(cssW / iw, cssH / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  ctx.drawImage(img, (cssW - dw) / 2, (cssH - dh) / 2, dw, dh);
}

// ─── Component ──────────────────────────────────────────────────────────────

interface Props {
  phase: TransitionPhase;
  framesRef: React.MutableRefObject<HTMLImageElement[]>;
}

export default function PageTransitionOverlay({ phase, framesRef }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const reducedMotionRef = useRef(false);

  // Opacity is derived purely from the phase prop — no React state needed.
  //   active  → 1  (overlay appears instantly; no fade-in so the page underneath
  //                  can never bleed through during a fast navigation)
  //   exiting → 0  (CSS transition fades it out gracefully)
  //
  // Keeping `transition` constant at '500ms ease' lets the browser animate
  // the 1→0 change when exiting without requiring any JS-driven style flips.
  const isExiting = phase === 'exiting';

  // ── Detect reduced-motion preference once on mount ───────────────────
  useEffect(() => {
    reducedMotionRef.current = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
  }, []);

  // ── Jump progress bar to 100 % when fading out ───────────────────────
  useEffect(() => {
    if (phase !== 'exiting') return;
    const bar = progressRef.current;
    if (!bar) return;
    bar.style.transition = 'width 300ms ease';
    bar.style.width = '100%';
  }, [phase]);

  // ── Canvas animation — runs during the active phase only ─────────────
  useEffect(() => {
    if (phase !== 'active') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let cssW = window.innerWidth;
    let cssH = window.innerHeight;

    const applySize = () => {
      cssW = window.innerWidth;
      cssH = window.innerHeight;
      canvas.width = cssW * dpr;
      canvas.height = cssH * dpr;
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      // canvas.width reset clears the transform — re-apply DPR scale
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    applySize();

    // ── Reduced-motion: static dark fill + linear progress, no frames ──
    if (reducedMotionRef.current) {
      ctx.fillStyle = '#080808';
      ctx.fillRect(0, 0, cssW, cssH);
      const bar = progressRef.current;
      if (bar) {
        bar.style.transition = `width ${PAGE_TRANSITION_DURATION_MS}ms linear`;
        bar.style.width = '90%';
      }
      const handleResize = () => {
        applySize();
        ctx.fillStyle = '#080808';
        ctx.fillRect(0, 0, cssW, cssH);
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }

    // ── Full animation ────────────────────────────────────────────────

    // Paint the first frame synchronously (before the RAF loop) so there
    // is zero blank-canvas time between mount and the first animated frame.
    const firstFrame = framesRef.current[0];
    ctx.fillStyle = '#080808';
    ctx.fillRect(0, 0, cssW, cssH);
    if (firstFrame?.complete && firstFrame.naturalWidth > 0) {
      drawFrameCover(ctx, firstFrame, cssW, cssH);
    }

    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / PAGE_TRANSITION_DURATION_MS, 1);

      // Map normalised time → 0-based frame index, clamped to last frame
      const frameIndex = Math.min(
        Math.floor(t * PAGE_TRANSITION_FRAME_COUNT),
        PAGE_TRANSITION_FRAME_COUNT - 1
      );
      const frame = framesRef.current[frameIndex];

      // Dark base ensures unloaded frames don't flash white
      ctx.fillStyle = '#080808';
      ctx.fillRect(0, 0, cssW, cssH);
      if (frame?.complete && frame.naturalWidth > 0) {
        drawFrameCover(ctx, frame, cssW, cssH);
      }

      // Drive the progress bar via direct DOM mutation (no re-render per frame)
      const bar = progressRef.current;
      if (bar) bar.style.width = `${t * 90}%`;

      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
      // When t === 1 the RAF naturally stops.
      // PageTransitionProvider's timeDone + routeDone logic calls beginExit().
    };

    rafRef.current = requestAnimationFrame(animate);

    const handleResize = () => applySize();
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [phase, framesRef]);

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        // Instant full-opacity on mount (no fade-in) prevents any page content
        // from bleeding through the overlay during fast cached navigations.
        // The 500ms ease transition only applies to the 1→0 change on exit.
        opacity: isExiting ? 0 : 1,
        transition: 'opacity 500ms ease',
        pointerEvents: 'all',
        willChange: 'opacity',
      }}
    >
      {/* Solid dark base — visible before/between frames and on reduced-motion */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: '#080808',
        }}
      />

      {/* Frame animation canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          display: 'block',
        }}
      />

      {/* Cinematic vignette — darkens edges for a premium look */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, transparent 35%, rgba(0,0,0,0.6) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Progress bar — 2 px, cyan accent, above everything */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'rgba(255,255,255,0.06)',
          zIndex: 1,
        }}
      >
        <div
          ref={progressRef}
          style={{
            height: '100%',
            width: '0%',
            background: 'linear-gradient(90deg, #00d4ff 0%, #0066ff 100%)',
            boxShadow: '0 0 10px rgba(0,212,255,0.85)',
            transition: 'width 120ms linear',
          }}
        />
      </div>
    </div>
  );
}
