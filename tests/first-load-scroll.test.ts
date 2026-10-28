import { describe, it, expect } from 'vitest';
import {
  shouldAutoScroll,
  scrollBehaviorFor,
  hasLanded,
  LANDING_TOLERANCE_PX,
  type AutoScrollConditions,
} from '@/lib/first-load-scroll';

/** A fresh load with nothing standing in the way. */
const CLEAN: AutoScrollConditions = {
  hash: '',
  scrollY: 0,
  interacted: false,
  alreadyMoved: false,
};

describe('shouldAutoScroll', () => {
  it('scrolls on a clean load', () => {
    expect(shouldAutoScroll(CLEAN)).toBe(true);
  });

  /** /#contact is where the visitor asked to go; moving them is a bug. */
  it('stands down for a deep link', () => {
    expect(shouldAutoScroll({ ...CLEAN, hash: '#contact' })).toBe(false);
  });

  it('ignores a bare hash, which targets nothing', () => {
    expect(shouldAutoScroll({ ...CLEAN, hash: '#' })).toBe(true);
  });

  /** Back-navigation restores a scroll position; yanking it reads as a glitch. */
  it('stands down when the page is already scrolled', () => {
    expect(shouldAutoScroll({ ...CLEAN, scrollY: 1 })).toBe(false);
    expect(shouldAutoScroll({ ...CLEAN, scrollY: 4000 })).toBe(false);
  });

  /** If they started scrolling while we waited, they are already on their way. */
  it('stands down once the visitor has interacted', () => {
    expect(shouldAutoScroll({ ...CLEAN, interacted: true })).toBe(false);
  });

  it('needs only one objection to stand down', () => {
    expect(shouldAutoScroll({ ...CLEAN, hash: '#contact', interacted: true })).toBe(false);
  });

  /**
   * Reduced motion is deliberately NOT a veto. It changes how the scroll travels,
   * not whether it happens — an earlier version skipped it outright, which hid
   * the feature from everyone with OS animation effects turned off.
   */
  it('still scrolls under reduced motion, which only affects the behaviour', () => {
    expect(shouldAutoScroll(CLEAN)).toBe(true);
    expect(scrollBehaviorFor(true)).not.toBe('smooth');
  });
});

describe('scrollBehaviorFor', () => {
  it('animates by default', () => {
    expect(scrollBehaviorFor(false)).toBe('smooth');
  });

  /**
   * 'instant', never 'auto': globals.css sets `scroll-behavior: smooth` on the
   * document, and 'auto' defers to that, so it would animate anyway.
   */
  it('jumps instantly under reduced motion, bypassing the CSS smooth scroll', () => {
    expect(scrollBehaviorFor(true)).toBe('instant');
  });
});

describe('shouldAutoScroll, once we have moved the page ourselves', () => {
  const MOVED: AutoScrollConditions = { ...CLEAN, alreadyMoved: true, scrollY: 2580 };

  /**
   * The retry loop depends on this. Our own first scroll leaves scrollY well
   * above zero, and reading that as "the visitor scrolled" would veto every
   * retry after it — which is exactly the state /store ends up in when its first
   * attempt is dropped mid-stream.
   */
  it('does not treat our own scroll as the visitor having scrolled', () => {
    expect(shouldAutoScroll(MOVED)).toBe(true);
  });

  it('still stands down for an interaction after we have moved', () => {
    expect(shouldAutoScroll({ ...MOVED, interacted: true })).toBe(false);
  });

  it('still stands down for a deep link after we have moved', () => {
    expect(shouldAutoScroll({ ...MOVED, hash: '#contact' })).toBe(false);
  });
});

describe('hasLanded', () => {
  it('accepts an exact arrival', () => {
    expect(hasLanded(2580, 2580)).toBe(true);
  });

  /** Sub-pixel layout and rounding mean the two rarely match exactly. */
  it('tolerates a few pixels either side', () => {
    expect(hasLanded(2580 + LANDING_TOLERANCE_PX, 2580)).toBe(true);
    expect(hasLanded(2580 - LANDING_TOLERANCE_PX, 2580)).toBe(true);
  });

  it('rejects a scroll that was dropped or overshot', () => {
    expect(hasLanded(0, 2580)).toBe(false);
    expect(hasLanded(2580, 6192)).toBe(false);
    expect(hasLanded(2580 + LANDING_TOLERANCE_PX + 1, 2580)).toBe(false);
  });
});
