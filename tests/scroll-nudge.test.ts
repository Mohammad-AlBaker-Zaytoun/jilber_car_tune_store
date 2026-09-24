import { describe, it, expect } from 'vitest';
import {
  shouldNudge,
  nudgeBehavior,
  nudgeDistance,
  type NudgeConditions,
} from '@/lib/scroll-nudge';

/** A fresh load with nothing standing in the way. */
const CLEAN: NudgeConditions = {
  hash: '',
  scrollY: 0,
  interacted: false,
};

describe('shouldNudge', () => {
  it('nudges on a clean load', () => {
    expect(shouldNudge(CLEAN)).toBe(true);
  });

  /** /#contact is where the visitor asked to go; moving them is a bug. */
  it('stands down for a deep link', () => {
    expect(shouldNudge({ ...CLEAN, hash: '#contact' })).toBe(false);
  });

  it('ignores a bare hash, which targets nothing', () => {
    expect(shouldNudge({ ...CLEAN, hash: '#' })).toBe(true);
  });

  /** Back-navigation restores a scroll position; yanking it reads as a glitch. */
  it('stands down when the page is already scrolled', () => {
    expect(shouldNudge({ ...CLEAN, scrollY: 1 })).toBe(false);
    expect(shouldNudge({ ...CLEAN, scrollY: 4000 })).toBe(false);
  });

  /** If they started scrolling while we waited, they already know it scrolls. */
  it('stands down once the visitor has interacted', () => {
    expect(shouldNudge({ ...CLEAN, interacted: true })).toBe(false);
  });

  it('needs only one objection to stand down', () => {
    expect(shouldNudge({ ...CLEAN, hash: '#contact', interacted: true })).toBe(false);
  });

  /**
   * Reduced motion is deliberately NOT a veto. It changes how the nudge travels,
   * not whether it happens — an earlier version skipped it outright, which hid
   * the feature from everyone with OS animation effects turned off.
   */
  it('still nudges under reduced motion, which only affects the behaviour', () => {
    expect(shouldNudge(CLEAN)).toBe(true);
    expect(nudgeBehavior(true)).not.toBe('smooth');
  });
});

describe('nudgeBehavior', () => {
  it('animates by default', () => {
    expect(nudgeBehavior(false)).toBe('smooth');
  });

  /**
   * 'instant', never 'auto': globals.css sets `scroll-behavior: smooth` on the
   * document, and 'auto' defers to that, so it would animate anyway.
   */
  it('jumps instantly under reduced motion, bypassing the CSS smooth scroll', () => {
    expect(nudgeBehavior(true)).toBe('instant');
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
