'use client';

import { useEffect } from 'react';
import { shouldNudge, nudgeBehavior, nudgeDistance } from '@/lib/scroll-nudge';

/** Long enough for layout and any scroll restoration to settle before we move. */
const SETTLE_MS = 600;

/**
 * Scrolls one viewport down when the page loads.
 *
 * Both heroes are scroll-driven frame animations — 720svh on the landing page,
 * 300svh on the store — so a visitor who does not realise the page scrolls sees
 * a still image. One viewport is enough to start the animation and show there is
 * more below, without skipping the hero the way scrolling to the first section
 * would.
 *
 * Renders nothing. Stands down for a deep link, an already-scrolled page, or any
 * interaction while it waits; travels instantly instead of animating under
 * prefers-reduced-motion. See lib/scroll-nudge.ts.
 */
export default function FirstLoadScrollNudge() {
  useEffect(() => {
    let interacted = false;
    const markInteracted = () => {
      interacted = true;
    };

    // Passive: these listeners only observe, and must never delay a real scroll.
    const events = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const;
    for (const e of events) window.addEventListener(e, markInteracted, { passive: true });

    const timer = window.setTimeout(() => {
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (
        shouldNudge({
          hash: window.location.hash,
          scrollY: window.scrollY,
          interacted,
        })
      ) {
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo({
          top: nudgeDistance(window.innerHeight, maxScroll),
          behavior: nudgeBehavior(reducedMotion),
        });
      }

      for (const e of events) window.removeEventListener(e, markInteracted);
    }, SETTLE_MS);

    return () => {
      window.clearTimeout(timer);
      for (const e of events) window.removeEventListener(e, markInteracted);
    };
  }, []);

  return null;
}
