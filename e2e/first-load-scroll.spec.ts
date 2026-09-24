import { test, expect, type Page } from '@playwright/test';

/**
 * The first-load scroll past the hero.
 *
 * Both landing pages open on a pinned, scroll-driven frame animation — 6,192px
 * tall on the home page — so a visitor who does not scroll sees one still image.
 *
 * Asserted in a real browser rather than only in unit tests because every failure
 * of this feature so far was environmental: a guard that stood down for reasons
 * the pure conditions could not see, and before that a distance that moved the
 * page without changing anything on screen.
 */

/** The scroll waits 600ms for layout to settle, then animates for up to ~1.4s. */
const SETTLED_MS = 3000;

async function scrollAfterSettling(page: Page) {
  await page.waitForTimeout(SETTLED_MS);
  return page.evaluate(() => Math.round(window.scrollY));
}

function topOf(page: Page, selector: string) {
  return page.evaluate((s) => {
    const el = document.querySelector(s);
    return el ? Math.round(el.getBoundingClientRect().top + window.scrollY) : -1;
  }, selector);
}

const PAGES = [
  { path: '/', target: '#services' },
  { path: '/store', target: '#products' },
];

test.describe('First-load scroll', () => {
  for (const { path, target } of PAGES) {
    test(`lands on ${target} on ${path}`, async ({ page }) => {
      await page.goto(path);
      // The store list streams in, so it is not in the DOM the moment goto resolves.
      await page.waitForSelector(target, { state: 'attached' });

      // Captured before the scroll, while the hero is still at its full height.
      const destination = await topOf(page, target);
      expect(destination).toBeGreaterThan(0);

      const scrollY = await scrollAfterSettling(page);
      expect(Math.abs(scrollY - destination)).toBeLessThan(5);
    });

    /**
     * The regression that made this look broken: an earlier version moved one
     * viewport, which on a pinned hero several screens tall left the visitor
     * looking at exactly what they started with.
     */
    test(`goes well past a single viewport on ${path}`, async ({ page }) => {
      await page.goto(path);
      const viewport = page.viewportSize()?.height ?? 0;

      expect(await scrollAfterSettling(page)).toBeGreaterThan(viewport * 2);
    });
  }

  test('the destination is actually on screen afterwards', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(SETTLED_MS);

    await expect(page.getByRole('heading', { name: /our services/i })).toBeInViewport();
  });

  test('reloading scrolls again rather than firing only once per tab', async ({ page }) => {
    await page.goto('/');
    const destination = await topOf(page, '#services');
    expect(await scrollAfterSettling(page)).toBeGreaterThan(destination - 5);

    // Back to the top before reloading, and confirmed still there inside the
    // settle window. Without this the browser restoring the previous scroll
    // position would satisfy the assertion below on its own, and the test would
    // pass whether the scroll fired or not.
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.reload();
    await page.waitForTimeout(150);
    expect(await page.evaluate(() => Math.round(window.scrollY))).toBe(0);

    expect(await scrollAfterSettling(page)).toBeGreaterThan(destination - 5);
  });

  /**
   * With reduced motion set, an earlier version skipped the scroll entirely so
   * the page never moved. That it travels instantly rather than smoothly is
   * asserted on scrollBehaviorFor() in the unit tests — the two are
   * indistinguishable here once the animation has had time to finish.
   */
  test('still arrives under reduced motion', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('/');

    expect(
      await page.evaluate(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    ).toBe(true);

    const destination = await topOf(page, '#services');
    expect(await scrollAfterSettling(page)).toBeGreaterThan(destination - 5);

    await context.close();
  });

  test('leaves a deep link alone', async ({ page }) => {
    await page.goto('/#contact');

    const contactTop = await topOf(page, '#contact');
    const scrollY = await scrollAfterSettling(page);

    // The visitor asked for #contact, which is far below #services; the
    // first-load scroll must not drag them back up to it.
    expect(Math.abs(scrollY - contactTop)).toBeLessThan(5);
  });

  test('does not fight a visitor who is already scrolling', async ({ page }) => {
    await page.goto('/');
    const destination = await topOf(page, '#services');

    // Inside the 600ms settle window, so the interaction is seen.
    await page.waitForTimeout(150);
    await page.mouse.move(400, 400);
    await page.mouse.wheel(0, 3000);
    // mouse.wheel resolves before the scroll has been applied.
    await page.waitForTimeout(250);
    const afterInteraction = await page.evaluate(() => Math.round(window.scrollY));
    expect(afterInteraction).toBeGreaterThan(0);

    await page.waitForTimeout(SETTLED_MS);
    const settled = await page.evaluate(() => Math.round(window.scrollY));

    // Whatever their own scroll reached, they must not have been moved from it,
    // and in particular must not have been carried down to the destination.
    expect(settled).toBe(afterInteraction);
    expect(settled).toBeLessThan(destination - 100);
  });
});
