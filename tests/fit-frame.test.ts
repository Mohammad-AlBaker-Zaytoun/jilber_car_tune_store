import { describe, it, expect } from 'vitest';
import { computeFrameFit, MAX_CROP_FACTOR } from '@/lib/transition/fitFrame';

/** The transition frames are all 1280x720. */
const FW = 1280;
const FH = 720;

/** Fraction of the frame's width actually on screen. */
function visibleWidthFraction(vw: number, vh: number): number {
  const fit = computeFrameFit(FW, FH, vw, vh)!;
  return Math.min(1, vw / fit.dw);
}

describe('computeFrameFit', () => {
  it('returns null before the image has decoded', () => {
    expect(computeFrameFit(0, 0, 390, 844)).toBeNull();
    expect(computeFrameFit(FW, FH, 0, 0)).toBeNull();
  });

  it('still fills the screen on a laptop (behaviour unchanged)', () => {
    const fit = computeFrameFit(FW, FH, 1366, 900)!;
    expect(fit.fullBleed).toBe(true);
    expect(fit.dw).toBeGreaterThanOrEqual(1366);
    expect(fit.dh).toBeGreaterThanOrEqual(900);
  });

  it('still fills the screen on a phone in landscape', () => {
    expect(computeFrameFit(FW, FH, 844, 390)!.fullBleed).toBe(true);
  });

  /**
   * The bug this rule exists for: a plain cover fit showed ~26% of the frame
   * width on a portrait phone.
   */
  it('shows most of the frame on a portrait phone instead of a centre crop', () => {
    const coverOnly = 390 / (FW * Math.max(390 / FW, 844 / FH));
    expect(coverOnly).toBeLessThan(0.3); // the old behaviour, for contrast

    expect(visibleWidthFraction(390, 844)).toBeGreaterThanOrEqual(0.79);
  });

  it('never crops more than the configured ceiling, on any viewport', () => {
    const viewports: Array<[number, number]> = [
      [320, 568],   // iPhone SE
      [360, 800],   // common Android
      [390, 844],   // iPhone 14
      [430, 932],   // iPhone Pro Max
      [768, 1024],  // iPad portrait
      [820, 1180],  // iPad Air portrait
      [1024, 1366], // iPad Pro portrait
      [1366, 768],  // laptop
      [1920, 1080], // desktop
      [2560, 1080], // ultrawide
      [844, 390],   // phone landscape
    ];
    const minVisible = 1 / MAX_CROP_FACTOR; // 0.8 at 1.25
    for (const [vw, vh] of viewports) {
      const label = `${vw}x${vh}`;
      expect(visibleWidthFraction(vw, vh), label).toBeGreaterThanOrEqual(minVisible - 0.001);
    }
  });

  it('centres the frame, and letterboxes symmetrically when it does not fill', () => {
    const fit = computeFrameFit(FW, FH, 390, 844)!;
    expect(fit.dx).toBeCloseTo((390 - fit.dw) / 2, 5);
    expect(fit.dy).toBeCloseTo((844 - fit.dh) / 2, 5);
    expect(fit.fullBleed).toBe(false);
  });

  it('degrades continuously — no jump between two looks', () => {
    // Sweeping the viewport narrower must not produce a discontinuity in scale.
    let previous = computeFrameFit(FW, FH, 1200, 800)!.scale;
    for (let vw = 1190; vw >= 320; vw -= 10) {
      const scale = computeFrameFit(FW, FH, vw, 800)!.scale;
      expect(Math.abs(scale - previous), `at width ${vw}`).toBeLessThan(0.05);
      previous = scale;
    }
  });
});
