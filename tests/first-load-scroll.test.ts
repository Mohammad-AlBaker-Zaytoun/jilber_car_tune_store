import { describe, it, expect } from 'vitest';
import {
  shouldAutoScroll,
  scrollBehaviorFor,
  type AutoScrollConditions,
} from '@/lib/first-load-scroll';

/** A fresh load with nothing standing in the way. */
const CLEAN: AutoScrollConditions = {
  hash: '',
  scrollY: 0,
  interacted: false,
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
