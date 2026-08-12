'use client';

import { useEffect, useRef, useState } from 'react';
import {
  PAGE_TRANSITION_DURATION_MS,
  PAGE_TRANSITION_FRAME_COUNT,
  TRANSITION_DURATION_MS,
  type TransitionPhase,
  type TransitionVariant,
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
  /** 'cinematic' plays the frame sequence; 'light' is a plain CSS fade. */
  variant: TransitionVariant;
  framesRef: React.MutableRefObject<HTMLImageElement[]>;
}

export default function PageTransitionOverlay({ phase, variant, framesRef }: Props) {
  const isLight = variant === 'light';
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const reducedMotionRef = useRef(false);
  const [hasEntered, setHasEntered] = useState(false);

  // The entrance state supplies a distinct transparent first paint; the phase
  // still controls the longer exit fade.
  const isExiting = phase === 'exiting';

  // Mount transparent, then reveal on the next paint so the transition has a
  // real starting frame instead of replacing the page abruptly.
  useEffect(() => {
    const frame = requestAnimationFrame(() => setHasEntered(true));
    return () => cancelAnimationFrame(frame);
  }, []);

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

  // ── Light variant: drive the progress bar with CSS, no canvas ────────
  useEffect(() => {
    if (!isLight || phase !== 'active') return;
    const bar = progressRef.current;
    if (!bar) return;
    bar.style.transition = `width ${TRANSITION_DURATION_MS.light}ms ease-out`;
    bar.style.width = '90%';
  }, [isLight, phase]);

  // ── Canvas animation — cinematic variant, active phase only ──────────
  useEffect(() => {
    if (isLight) return;
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
  }, [isLight, phase, framesRef]);

  // ── Render: light variant ─────────────────────────────────────────────
  //
  // A translucent veil over the outgoing page rather than the opaque #080808
  // used by the cinematic version: in a working tool it should read as a brief
  // dim, not as the screen being replaced. No canvas, no frames, no vignette.
  if (isLight) {
    return (
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          opacity: isExiting || !hasEntered ? 0 : 1,
          transition: isExiting ? 'opacity 200ms ease' : 'opacity 120ms ease-out',
          // Same reasoning as the cinematic variant: the overlay outlives the
          // navigation by the length of its fade, and must not swallow clicks
          // on the page that has already arrived underneath it.
          pointerEvents: isExiting ? 'none' : 'all',
          willChange: 'opacity',
          background: 'rgba(6, 10, 16, 0.55)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'rgba(255,255,255,0.06)',
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

  // ── Render: cinematic variant ─────────────────────────────────────────

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        // Ease the overlay in quickly, then use the longer cinematic fade-out.
        opacity: isExiting || !hasEntered ? 0 : 1,
        transition: isExiting
          ? 'opacity 500ms ease'
          : 'opacity 240ms cubic-bezier(0.16, 1, 0.3, 1)',
        // Must go transparent to input during the fade-out. The overlay stays
        // mounted at zIndex 9999 for the full 600ms exit phase, so an
        // unconditional 'all' meant every click, tap and scrollbar drag on the
        // freshly-arrived page was swallowed for 600ms after EVERY navigation —
        // the destination looked interactive and simply ignored you.
        pointerEvents: isExiting ? 'none' : 'all',
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
