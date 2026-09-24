'use client';

import { useEffect } from 'react';
import { shouldAutoScroll, scrollBehaviorFor } from '@/lib/first-load-scroll';

/** Long enough for layout and any scroll restoration to settle before we move. */
const SETTLE_MS = 600;

/**
 * Scrolls past the hero to the first section of real content when a page loads.
 *
 * Both landing pages open on a scroll-driven frame animation that is pinned: the
 * headline and buttons stay put while only the background frame advances. On the
 * home page it is 6,192px tall, so a visitor who does not scroll sees one still
 * image and nothing else — and an earlier version of this component that moved a
 * single viewport was invisible for exactly that reason, because 860px into a
 * pinned 6,192px hero looks identical to the top of it.
 *
 * `target` is a selector for where to land: the services grid on the home page,
 * the product list on the store. scrollIntoView rather than a pixel offset, so it
 * lands where the matching nav link would and honours any scroll-margin-top.
 *
 * Renders nothing. Stands down for a deep link, an already-scrolled page, or any
 * interaction while it waits; travels instantly instead of animating under
 * prefers-reduced-motion. See lib/first-load-scroll.ts.
 */
export default function FirstLoadScroll({ target }: { target: string }) {
  useEffect(() => {
    let interacted = false;
    const markInteracted = () => {
      interacted = true;
    };

    // Passive: these listeners only observe, and must never delay a real scroll.
    const events = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const;
    for (const e of events) window.addEventListener(e, markInteracted, { passive: true });

    const timer = window.setTimeout(() => {
      const destination = document.querySelector(target);

      if (
        destination &&
        shouldAutoScroll({
          hash: window.location.hash,
          scrollY: window.scrollY,
          interacted,
        })
      ) {
        destination.scrollIntoView({
          behavior: scrollBehaviorFor(
            window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ),
          block: 'start',
        });
      }

      for (const e of events) window.removeEventListener(e, markInteracted);
    }, SETTLE_MS);

    return () => {
      window.clearTimeout(timer);
      for (const e of events) window.removeEventListener(e, markInteracted);
    };
  }, [target]);

  return null;
}
