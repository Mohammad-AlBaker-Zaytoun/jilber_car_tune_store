import { test, expect } from '@playwright/test';

/**
 * The first-load scroll nudge.
 *
 * Both landing pages open on a scroll-driven frame animation, so a visitor who
 * does not realise the page scrolls sees a still image. The nudge moves one
 * viewport down to start it.
 *
 * Asserted here rather than only in unit tests because every previous failure of
 * this feature was environmental — a guard that stood down for reasons the pure
 * conditions could not see — and only a real browser settles whether the page
 * actually moves.
 */

/** The nudge waits 600ms for layout to settle, then animates. */
const SETTLED_MS = 2000;

async function scrollAfterSettling(page: import('@playwright/test').Page) {
  await page.waitForTimeout(SETTLED_MS);
  return page.evaluate(() => Math.round(window.scrollY));
}

test.describe('First-load scroll nudge', () => {
  for (const path of ['/', '/store']) {
    test(`moves one viewport down on ${path}`, async ({ page }) => {
      await page.goto(path);
      const viewport = page.viewportSize()?.height ?? 0;
      expect(viewport).toBeGreaterThan(0);

      const scrollY = await scrollAfterSettling(page);

      // One viewport, within a pixel or two of rounding.
      expect(scrollY).toBeGreaterThan(viewport - 5);
      expect(scrollY).toBeLessThan(viewport + 5);
    });
  }

  test('reloading nudges again rather than firing only once per tab', async ({ page }) => {
    await page.goto('/');
    const viewport = page.viewportSize()?.height ?? 0;
    expect(await scrollAfterSettling(page)).toBeGreaterThan(viewport - 5);

    // Back to the top before reloading, and confirmed still there inside the
    // settle window. Without this the browser restoring the previous scroll
    // position would satisfy the assertion below on its own, and the test would
    // pass whether the nudge fired or not.
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.reload();
    await page.waitForTimeout(150);
    expect(await page.evaluate(() => Math.round(window.scrollY))).toBe(0);

    // A sessionStorage one-shot made this second load do nothing, which is what
    // made the feature look broken to anyone testing it by refreshing.
    expect(await scrollAfterSettling(page)).toBeGreaterThan(viewport - 5);
  });

  /**
   * The reported symptom: with reduced motion set, an earlier version skipped the
   * nudge entirely, so the page never moved. That it travels instantly rather
   * than smoothly is asserted on nudgeBehavior() in the unit tests -- the two are
   * indistinguishable here once the animation has had time to finish.
   */
  test('still arrives under reduced motion', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('/');
    const viewport = page.viewportSize()?.height ?? 0;

    expect(await page.evaluate(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
    expect(await scrollAfterSettling(page)).toBeGreaterThan(viewport - 5);

    await context.close();
  });

  test('leaves a deep link alone', async ({ page }) => {
    await page.goto('/#contact');
    const viewport = page.viewportSize()?.height ?? 0;

    const scrollY = await scrollAfterSettling(page);

    // The browser's own anchor scroll goes far past one viewport; the nudge must
    // not drag the visitor back up to it.
    expect(scrollY).toBeGreaterThan(viewport * 2);
  });

  test('does not fight a visitor who is already scrolling', async ({ page }) => {
    await page.goto('/');
    // Inside the 600ms settle window, so the nudge sees the interaction.
    await page.waitForTimeout(150);
    await page.mouse.wheel(0, 3000);
    const afterInteraction = await page.evaluate(() => Math.round(window.scrollY));

    await page.waitForTimeout(SETTLED_MS);
    const settled = await page.evaluate(() => Math.round(window.scrollY));

    // Whatever the visitor's own scroll reached, the nudge must not have pulled
    // them back to one viewport.
    expect(settled).toBeGreaterThanOrEqual(afterInteraction);
  });
});
