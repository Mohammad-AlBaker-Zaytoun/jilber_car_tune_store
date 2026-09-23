/**
 * Whether the first-load scroll nudge should run.
 *
 * Pure so the conditions can be tested without a browser. Each one exists
 * because moving someone's viewport for them is hostile when they did not ask:
 * the nudge has to lose every argument with the visitor's own intent.
 */
export interface NudgeConditions {
  /** `location.hash` — a deep link such as /#contact is the visitor's target, not ours. */
  hash: string;
  /** Current scroll offset. Non-zero means a restored position or a head start. */
  scrollY: number;
  /** `prefers-reduced-motion: reduce`. Unrequested motion is precisely what it opts out of. */
  reducedMotion: boolean;
  /** Already nudged this page in this tab, so returning to it stays still. */
  alreadyNudged: boolean;
  /** The visitor scrolled, tapped or typed while we waited for layout to settle. */
  interacted: boolean;
}

export function shouldNudge({
  hash,
  scrollY,
  reducedMotion,
  alreadyNudged,
  interacted,
}: NudgeConditions): boolean {
  if (hash && hash !== '#') return false;
  if (scrollY > 0) return false;
  if (reducedMotion) return false;
  if (alreadyNudged) return false;
  if (interacted) return false;
  return true;
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
