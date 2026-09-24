/**
 * Whether the first-load scroll nudge should run, and how.
 *
 * Pure so the conditions can be tested without a browser. Each one exists
 * because moving someone's viewport for them is hostile when they did not ask,
 * so the nudge has to lose every argument with the visitor's own intent.
 */
export interface NudgeConditions {
  /** `location.hash` — a deep link such as /#contact is the visitor's target, not ours. */
  hash: string;
  /** Current scroll offset. Non-zero means a restored position or a head start. */
  scrollY: number;
  /** The visitor scrolled, tapped or typed while we waited for layout to settle. */
  interacted: boolean;
}

export function shouldNudge({ hash, scrollY, interacted }: NudgeConditions): boolean {
  if (hash && hash !== '#') return false;
  if (scrollY > 0) return false;
  if (interacted) return false;
  return true;
}

/**
 * How to travel: animated normally, instant under prefers-reduced-motion.
 *
 * The preference is about motion, not about position, so the accommodation is to
 * arrive without the animation rather than to not arrive — skipping the nudge
 * outright hid the feature from everyone who has animation effects turned off in
 * their OS, which on Windows is a single Accessibility toggle.
 *
 * 'instant' rather than 'auto': globals.css sets `scroll-behavior: smooth` on the
 * document, and 'auto' defers to that CSS, so it would animate anyway.
 */
export function nudgeBehavior(reducedMotion: boolean): ScrollBehavior {
  return reducedMotion ? 'instant' : 'smooth';
}

/**
 * How far to nudge: one viewport, clamped to what the page can actually scroll.
 *
 * Without the clamp a short page would be asked to scroll past its own end,
 * which browsers silently floor — harmless, but it also means the caller cannot
 * tell a real nudge from a no-op.
 */
export function nudgeDistance(viewportHeight: number, maxScroll: number): number {
  return Math.max(0, Math.min(viewportHeight, maxScroll));
}
