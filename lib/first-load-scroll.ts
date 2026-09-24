/**
 * Whether the first-load scroll should run, and how it should travel.
 *
 * Pure so the conditions can be tested without a browser. Each one exists
 * because moving someone's viewport for them is hostile when they did not ask,
 * so it has to lose every argument with the visitor's own intent.
 */
export interface AutoScrollConditions {
  /** `location.hash` — a deep link such as /#contact is the visitor's target, not ours. */
  hash: string;
  /** Current scroll offset. Non-zero means a restored position or a head start. */
  scrollY: number;
  /** The visitor scrolled, tapped or typed while we waited for layout to settle. */
  interacted: boolean;
  /**
   * True once we have moved the page ourselves.
   *
   * After that, `scrollY` is our own doing and can no longer be read as the
   * visitor having scrolled — without this the first attempt would veto every
   * retry that follows it.
   */
  alreadyMoved: boolean;
}

export function shouldAutoScroll({
  hash,
  scrollY,
  interacted,
  alreadyMoved,
}: AutoScrollConditions): boolean {
  if (hash && hash !== '#') return false;
  if (interacted) return false;
  if (!alreadyMoved && scrollY > 0) return false;
  return true;
}

/** Close enough to the target to stop trying. */
export const LANDING_TOLERANCE_PX = 4;

/**
 * Whether the page has arrived where it was sent.
 *
 * Needed because issuing the scroll is not the same as landing: on a page that
 * is still streaming, the browser drops or overshoots a programmatic scroll as
 * content keeps changing the layout beneath it.
 */
export function hasLanded(
  scrollY: number,
  targetTop: number,
  tolerance: number = LANDING_TOLERANCE_PX
): boolean {
  return Math.abs(scrollY - targetTop) <= tolerance;
}

/**
 * How to travel: animated normally, instant under prefers-reduced-motion.
 *
 * The preference is about motion, not about position, so the accommodation is to
 * arrive without the animation rather than to not arrive — skipping the scroll
 * outright hid it from everyone who has animation effects turned off in their OS,
 * which on Windows is a single Accessibility toggle.
 *
 * 'instant' rather than 'auto': globals.css sets `scroll-behavior: smooth` on the
 * document, and 'auto' defers to that CSS, so it would animate anyway.
 */
export function scrollBehaviorFor(reducedMotion: boolean): ScrollBehavior {
  return reducedMotion ? 'instant' : 'smooth';
}
