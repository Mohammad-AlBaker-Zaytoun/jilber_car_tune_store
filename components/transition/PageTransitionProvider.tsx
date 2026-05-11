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
import { shouldInterceptNavigation } from '@/lib/transition/isInternalNavigation';
import PageTransitionOverlay from './PageTransitionOverlay';

// ─── Config ────────────────────────────────────────────────────────────────

export const PAGE_TRANSITION_FRAME_COUNT = 60;
export const PAGE_TRANSITION_DURATION_MS = 900;

/**
 * How long the overlay fades out after the route settles (ms).
 * Must be >= the CSS `opacity` transition duration in PageTransitionOverlay
 * (currently 500 ms) so the element is never unmounted mid-animation.
 */
const FADE_OUT_MS = 600;

/** Force-exit transition if the route never settles (network error, etc.). */
const MAX_TRANSITION_MS = 8000;

export const PAGE_TRANSITION_FRAME_PATH = (index: number) =>
  `/page-transition-frames/frame_${String(index).padStart(4, '0')}.webp`;

// ─── Context ────────────────────────────────────────────────────────────────

export type TransitionPhase = 'idle' | 'active' | 'exiting';

interface TransitionContextValue {
  triggerTransition: (href: string) => void;
  phase: TransitionPhase;
  framesRef: React.MutableRefObject<HTMLImageElement[]>;
}

const TransitionContext = createContext<TransitionContextValue>({
  triggerTransition: () => {},
  phase: 'idle',
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

  // Refs that survive re-renders without triggering them
  const framesRef = useRef<HTMLImageElement[]>([]);
  const phaseRef = useRef<TransitionPhase>('idle');
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

  // Preload all 60 frames during browser idle time so the first click feels instant
  useEffect(() => {
    const load = () => {
      const images: HTMLImageElement[] = [];
      for (let i = 1; i <= PAGE_TRANSITION_FRAME_COUNT; i++) {
        const img = new window.Image();
        img.src = PAGE_TRANSITION_FRAME_PATH(i);
        img.decoding = 'async';
        images.push(img);
      }
      framesRef.current = images;
    };

    if (typeof requestIdleCallback !== 'undefined') {
      const id = requestIdleCallback(load, { timeout: 3000 });
      return () => cancelIdleCallback(id);
    }
    const t = setTimeout(load, 500);
    return () => clearTimeout(t);
  }, []);

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
    }, FADE_OUT_MS);
  }, []);

  const triggerTransition = useCallback(
    (href: string) => {
      if (phaseRef.current !== 'idle') return;

      routeDoneRef.current = false;
      timeDoneRef.current = false;

      // Store the source pathname so we can detect ANY navigation change,
      // including server-side redirects to unexpected destinations.
      sourcePathnameRef.current = currentPathnameRef.current;

      phaseRef.current = 'active';
      setPhase('active');
      router.push(href);

      // Minimum animation duration: don't hide until all 60 frames played
      setTimeout(() => {
        timeDoneRef.current = true;
        if (routeDoneRef.current) beginExit();
      }, PAGE_TRANSITION_DURATION_MS);

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
    <TransitionContext.Provider value={{ triggerTransition, phase, framesRef }}>
      {children}
      {phase !== 'idle' && (
        <PageTransitionOverlay phase={phase} framesRef={framesRef} />
      )}
    </TransitionContext.Provider>
  );
}
