'use client';

import { useEffect } from 'react';
import { shouldAutoScroll, scrollBehaviorFor, hasLanded } from '@/lib/first-load-scroll';

/** Long enough for layout and any scroll restoration to settle before we move. */
const SETTLE_MS = 600;
/** Gap between checks while the target is still on its way into the DOM. */
const POLL_MS = 250;
/** Time allowed for a smooth scroll to finish before the landing is judged. */
const ANIMATION_GRACE_MS = 1800;
/** After this, the visitor has been looking at the page too long to be moved. */
const GIVE_UP_MS = 15_000;
/** Bound on re-issues, so a page that never settles cannot be scrolled forever. */
const MAX_ATTEMPTS = 6;

/**
 * Scrolls past the hero to the first section of real content when a page loads.
 *
 * Both landing pages open on a scroll-driven frame animation that is pinned: the
 * headline and buttons stay put while only the background frame advances. On the
 * home page it is 6,192px tall, so a visitor who does not scroll sees one still
 * image and nothing else.
 *
 * `target` is a selector for where to land: the services grid on the home page,
 * the product list on the store. scrollIntoView rather than a pixel offset, so it
 * lands where the matching nav link would and honours any scroll-margin-top.
 *
 * It retries rather than firing once, because /store weighs about 15MB — it
 * renders every product — and on a 5Mbps line a single attempt at 600ms lands in
 * the middle of the stream: the target is sometimes not in the DOM yet, and a
 * scroll that is issued gets dropped as more content changes the layout beneath
 * it. So it waits for the target to exist, scrolls, then checks whether it
 * actually arrived and goes again if not.
 *
 * Renders nothing. Stands down for a deep link, a page the visitor has already
 * scrolled, or any interaction at any point; travels instantly instead of
 * animating under prefers-reduced-motion. See lib/first-load-scroll.ts.
 */
export default function FirstLoadScroll({ target }: { target: string }) {
  useEffect(() => {
    let interacted = false;
    let alreadyMoved = false;
    let attempts = 0;
    let timer = 0;
    const deadline = Date.now() + GIVE_UP_MS;

    const markInteracted = () => {
      interacted = true;
    };

    // Passive: these listeners only observe, and must never delay a real scroll.
    const events = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const;
    for (const e of events) window.addEventListener(e, markInteracted, { passive: true });

    const stop = () => {
      window.clearTimeout(timer);
      for (const e of events) window.removeEventListener(e, markInteracted);
    };

    const tick = () => {
      if (
        !shouldAutoScroll({
          hash: window.location.hash,
          scrollY: window.scrollY,
          interacted,
          alreadyMoved,
        })
      ) {
        return stop();
      }
      if (Date.now() > deadline || attempts >= MAX_ATTEMPTS) return stop();

      const destination = document.querySelector(target);
      if (!destination) {
        // Still streaming in; look again shortly.
        timer = window.setTimeout(tick, POLL_MS);
        return;
      }

      const top = Math.round(destination.getBoundingClientRect().top + window.scrollY);
      if (alreadyMoved && hasLanded(window.scrollY, top)) return stop();

      destination.scrollIntoView({
        behavior: scrollBehaviorFor(window.matchMedia('(prefers-reduced-motion: reduce)').matches),
        block: 'start',
      });
      alreadyMoved = true;
      attempts += 1;
      timer = window.setTimeout(tick, ANIMATION_GRACE_MS);
    };

    timer = window.setTimeout(tick, SETTLE_MS);
    return stop;
  }, [target]);

  return null;
}
