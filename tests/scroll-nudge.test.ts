import { describe, it, expect } from 'vitest';
import { shouldNudge, nudgeDistance, type NudgeConditions } from '@/lib/scroll-nudge';

/** A fresh first load with nothing standing in the way. */
const CLEAN: NudgeConditions = {
  hash: '',
  scrollY: 0,
  reducedMotion: false,
  alreadyNudged: false,
  interacted: false,
};

describe('shouldNudge', () => {
  it('nudges on a clean first load', () => {
    expect(shouldNudge(CLEAN)).toBe(true);
  });

  /** /#contact is where the visitor asked to go; moving them is a bug. */
  it('stands down for a deep link', () => {
    expect(shouldNudge({ ...CLEAN, hash: '#contact' })).toBe(false);
  });

  it('ignores a bare hash, which targets nothing', () => {
    expect(shouldNudge({ ...CLEAN, hash: '#' })).toBe(true);
  });

  /** Back-navigation restores a scroll position; yanking it to the top reads as a glitch. */
  it('stands down when the page is already scrolled', () => {
    expect(shouldNudge({ ...CLEAN, scrollY: 1 })).toBe(false);
    expect(shouldNudge({ ...CLEAN, scrollY: 4000 })).toBe(false);
  });

  it('respects prefers-reduced-motion', () => {
    expect(shouldNudge({ ...CLEAN, reducedMotion: true })).toBe(false);
  });

  it('does not repeat within the same tab', () => {
    expect(shouldNudge({ ...CLEAN, alreadyNudged: true })).toBe(false);
  });

  /** If they started scrolling while we waited, they already know it scrolls. */
  it('stands down once the visitor has interacted', () => {
    expect(shouldNudge({ ...CLEAN, interacted: true })).toBe(false);
  });

  it('needs only one objection to stand down', () => {
    expect(shouldNudge({ ...CLEAN, reducedMotion: true, interacted: true })).toBe(false);
  });
});

describe('nudgeDistance', () => {
  it('nudges exactly one viewport on a long page', () => {
    expect(nudgeDistance(900, 60_000)).toBe(900);
  });

  it('never scrolls past the end of a short page', () => {
    expect(nudgeDistance(900, 300)).toBe(300);
  });

  it('is zero on a page that does not scroll', () => {
    expect(nudgeDistance(900, 0)).toBe(0);
  });

  /** scrollHeight can come in under innerHeight, making maxScroll negative. */
  it('never returns a negative distance', () => {
    expect(nudgeDistance(900, -50)).toBe(0);
  });
});
