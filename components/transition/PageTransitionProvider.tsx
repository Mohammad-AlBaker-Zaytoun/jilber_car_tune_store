'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  shouldInterceptNavigation,
  isLightTransitionArea,
} from '@/lib/transition/isInternalNavigation';
import PageTransitionOverlay from './PageTransitionOverlay';

// ─── Config ────────────────────────────────────────────────────────────────

export const PAGE_TRANSITION_FRAME_COUNT = 72;
export const PAGE_TRANSITION_DURATION_MS = 900;

/**
 * Two flavours of navigation.
 *
 * 'cinematic' — the 72-frame canvas sequence. Storefront only: it is a brand
 *   moment, and it costs 5.4 MB of frames plus a 900 ms hold.
 * 'light' — a fast CSS fade with the same progress bar. Used for the admin
 *   panel, where the animation should feel smooth but never make someone
 *   working through orders wait.
 */
export type TransitionVariant = 'cinematic' | 'light';

/** Minimum time the overlay is held, per variant. */
export const TRANSITION_DURATION_MS: Record<TransitionVariant, number> = {
  cinematic: PAGE_TRANSITION_DURATION_MS,
  light: 220,
};

/**
 * How long the overlay fades out after the route settles (ms).
 * Must be >= the CSS `opacity` transition duration for that variant in
 * PageTransitionOverlay, so the element is never unmounted mid-animation.
 */
const FADE_OUT_MS: Record<TransitionVariant, number> = {
  cinematic: 600,
  light: 240,
};

/** Force-exit transition if the route never settles (network error, etc.). */
const MAX_TRANSITION_MS = 8000;

export const PAGE_TRANSITION_FRAME_PATH = (index: number) =>
  `/pro-tuning-transition-frames-webp/frame_${String(index).padStart(4, '0')}.webp`;

// ─── Context ────────────────────────────────────────────────────────────────

export type TransitionPhase = 'idle' | 'active' | 'exiting';

interface TransitionContextValue {
  triggerTransition: (href: string) => void;
  phase: TransitionPhase;
  variant: TransitionVariant;
  framesRef: React.MutableRefObject<HTMLImageElement[]>;
}

const TransitionContext = createContext<TransitionContextValue>({
  triggerTransition: () => {},
  phase: 'idle',
  variant: 'cinematic',
  framesRef: { current: [] },
});

export function useTransitionContext(): TransitionContextValue {
  return useContext(TransitionContext);
}

// ─── Provider ───────────────────────────────────────────────────────────────

export function PageTransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [phase, setPhase] = useState<TransitionPhase>('idle');
  const [variant, setVariant] = useState<TransitionVariant>('cinematic');

  /** True while the user is inside the admin panel. */
  const inLightArea = isLightTransitionArea(pathname);

  // Refs that survive re-renders without triggering them
  const framesRef = useRef<HTMLImageElement[]>([]);
  const phaseRef = useRef<TransitionPhase>('idle');
  const variantRef = useRef<TransitionVariant>('cinematic');
  const currentPathnameRef = useRef(pathname);
  /**
   * Pathname at the moment triggerTransition was called.
   * We detect route completion by watching for ANY change from this value,
   * which correctly handles server-side redirects (e.g. /admin → /signin)
   * that would never match a fixed targetPathname.
   */
  const sourcePathnameRef = useRef<string | null>(null);
  const routeDoneRef = useRef(false);
  const timeDoneRef = useRef(false);
  const safetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep mutable refs in sync after every render (no deps = runs after every render)
  useEffect(() => {
    phaseRef.current = phase;
  });
  useEffect(() => {
    currentPathnameRef.current = pathname;
  }, [pathname]);

  /**
   * Preloads the transition frames during idle time, in batches.
   *
   * This provider is mounted in the root layout, so it runs on EVERY route.
   * Requesting all 72 frames (~5.4 MB) in one synchronous loop competed with the
   * page's own above-the-fold assets on every navigation. Batching inside idle
   * callbacks keeps it genuinely background work.
   *
   * Also skipped entirely when the visitor has asked for reduced motion — the
   * overlay respects that preference, so downloading the frames is pure waste —
   * and inside the admin panel, which uses the light variant and never draws a
   * single frame. An admin working through orders should not pay 5.4 MB for an
   * animation they will never see.
   */
  useEffect(() => {
    if (inLightArea) return;

    if (
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    const images: HTMLImageElement[] = [];
    let next = 1;
    let idleId: number | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const BATCH = 12;

    const loadBatch = () => {
      if (cancelled) return;
      const end = Math.min(next + BATCH - 1, PAGE_TRANSITION_FRAME_COUNT);
      for (; next <= end; next++) {
        const img = new window.Image();
        img.src = PAGE_TRANSITION_FRAME_PATH(next);
        img.decoding = 'async';
        images.push(img);
      }
      framesRef.current = images;
      if (next <= PAGE_TRANSITION_FRAME_COUNT) schedule();
    };

    const schedule = () => {
      if (typeof requestIdleCallback !== 'undefined') {
        idleId = requestIdleCallback(loadBatch, { timeout: 3000 });
      } else {
        timeoutId = setTimeout(loadBatch, 200);
      }
    };

    schedule();

    return () => {
      cancelled = true;
      if (idleId !== null && typeof cancelIdleCallback !== 'undefined') {
        cancelIdleCallback(idleId);
      }
      if (timeoutId !== null) clearTimeout(timeoutId);
    };
    // Depends on the boolean, not the pathname: re-running on every navigation
    // would restart the batch loop from frame 1 on each route change.
  }, [inLightArea]);

  // ── State machine ─────────────────────────────────────────────────────

  const beginExit = useCallback(() => {
    // Guard: only exit from the active phase; prevents double-calls
    if (phaseRef.current !== 'active') return;
    phaseRef.current = 'exiting'; // synchronous guard before React re-render

    if (safetyTimerRef.current !== null) {
      clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }

    setPhase('exiting');

    // After the CSS fade-out transition completes (+buffer), unmount the overlay
    setTimeout(() => {
      phaseRef.current = 'idle';
      setPhase('idle');
      sourcePathnameRef.current = null;
      routeDoneRef.current = false;
      timeDoneRef.current = false;
    }, FADE_OUT_MS[variantRef.current]);
  }, []);

  const triggerTransition = useCallback(
    (href: string) => {
      if (phaseRef.current !== 'idle') return;

      routeDoneRef.current = false;
      timeDoneRef.current = false;

      // Pick the variant from BOTH ends of the navigation. Either side being in
      // the admin panel means the light fade — entering it should not play the
      // cinematic sequence any more than leaving it should.
      let targetPathname = href;
      try {
        targetPathname = new URL(href, window.location.href).pathname;
      } catch {
        /* relative or malformed href — fall back to the raw string */
      }
      const nextVariant: TransitionVariant =
        isLightTransitionArea(currentPathnameRef.current) ||
        isLightTransitionArea(targetPathname)
          ? 'light'
          : 'cinematic';
      variantRef.current = nextVariant;
      setVariant(nextVariant);

      // Store the source pathname so we can detect ANY navigation change,
      // including server-side redirects to unexpected destinations.
      sourcePathnameRef.current = currentPathnameRef.current;

      phaseRef.current = 'active';
      setPhase('active');
      router.push(href);

      // Minimum hold: the cinematic variant waits for all frames to play; the
      // light one is just long enough to read as a deliberate fade.
      setTimeout(() => {
        timeDoneRef.current = true;
        if (routeDoneRef.current) beginExit();
      }, TRANSITION_DURATION_MS[nextVariant]);

      // Safety exit: never hang if the route never settles (redirect loops, errors, etc.)
      safetyTimerRef.current = setTimeout(() => {
        routeDoneRef.current = true;
        timeDoneRef.current = true;
        beginExit();
      }, MAX_TRANSITION_MS);
    },
    [router, beginExit]
  );

  // Detect route completion: any pathname change from the source page counts,
  // so redirects to unexpected paths are handled correctly.
  useEffect(() => {
    if (phase !== 'active') return;
    if (sourcePathnameRef.current === null) return;
    // Still on the source page — navigation hasn't committed yet
    if (pathname === sourcePathnameRef.current) return;

    routeDoneRef.current = true;
    if (timeDoneRef.current) beginExit();
  }, [pathname, phase, beginExit]);

  // ── Global click interceptor (capture phase) ──────────────────────────
  //
  // Fires before React's bubble-phase synthetic events.
  // e.preventDefault() sets nativeEvent.defaultPrevented = true.
  // Next.js <Link> checks this flag and skips its own router.push(),
  // so we never double-navigate.
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (phaseRef.current !== 'idle') return;

      const target = e.target as HTMLElement;
      const anchor = target.closest('a') as HTMLAnchorElement | null;
      if (!anchor) return;

      // Don't intercept clicks on interactive elements nested inside a link
      // (e.g. "Add to Cart" button wrapped inside a product card <Link>).
      if (target !== anchor) {
        const interactive = target.closest(
          'button, input, select, textarea, [role="button"]'
        );
        if (interactive && anchor.contains(interactive)) return;
      }

      if (!shouldInterceptNavigation(anchor, e, currentPathnameRef.current)) {
        return;
      }

      const href = anchor.getAttribute('href')!;
      e.preventDefault();
      triggerTransition(href);
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [triggerTransition]);

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <TransitionContext.Provider value={{ triggerTransition, phase, variant, framesRef }}>
      {children}
      {phase !== 'idle' && (
        <PageTransitionOverlay phase={phase} variant={variant} framesRef={framesRef} />
      )}
    </TransitionContext.Provider>
  );
}
