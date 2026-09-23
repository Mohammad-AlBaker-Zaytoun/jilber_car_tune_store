'use client';

import { useEffect } from 'react';
import { shouldNudge, nudgeDistance } from '@/lib/scroll-nudge';

/** Long enough for layout and any scroll restoration to settle before we move. */
const SETTLE_MS = 600;

/**
 * Scrolls one viewport down, smoothly, on a page's first load.
 *
 * Both heroes are scroll-driven frame animations — 720svh on the landing page,
 * 300svh on the store — so a visitor who does not realise the page scrolls sees
 * a still image. One viewport is enough to start the animation and show there is
 * more below, without skipping the hero the way scrolling to the first section
 * would.
 *
 * Renders nothing. Bails out of the nudge for a deep link, an already-scrolled
 * page, `prefers-reduced-motion`, a repeat visit in the same tab, or any
 * interaction while it waits — see lib/scroll-nudge.ts.
 */
export default function FirstLoadScrollNudge({ storageKey }: { storageKey: string }) {
  useEffect(() => {
    let interacted = false;
    const markInteracted = () => {
      interacted = true;
    };

    // Passive: these listeners only observe, and must never delay a real scroll.
    const events = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const;
    for (const e of events) window.addEventListener(e, markInteracted, { passive: true });

    const timer = window.setTimeout(() => {
      // sessionStorage throws in some privacy modes, and a nudge is not worth an
      // unhandled error on every page load.
      let alreadyNudged = false;
      try {
        alreadyNudged = window.sessionStorage.getItem(storageKey) === '1';
      } catch {
        alreadyNudged = false;
      }

      const ok = shouldNudge({
        hash: window.location.hash,
        scrollY: window.scrollY,
        reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        alreadyNudged,
        interacted,
      });

      if (ok) {
        try {
          window.sessionStorage.setItem(storageKey, '1');
        } catch {
          // Not worth failing the nudge over; it just may repeat next visit.
        }
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo({
          top: nudgeDistance(window.innerHeight, maxScroll),
          behavior: 'smooth',
        });
      }

      for (const e of events) window.removeEventListener(e, markInteracted);
    }, SETTLE_MS);

    return () => {
      window.clearTimeout(timer);
      for (const e of events) window.removeEventListener(e, markInteracted);
    };
  }, [storageKey]);

  return null;
}
