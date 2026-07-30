/**
 * Layout measurement primitives for the responsive audit.
 *
 * Pure measurement — nothing here asserts. `e2e/responsive.spec.ts` decides what
 * counts as a failure, so the same numbers can be reported before the fixes land
 * and enforced afterwards.
 */

import type { Page } from '@playwright/test';

/** One element that sticks out past the right edge of the viewport. */
export interface Offender {
  tag: string;
  id: string;
  classes: string;
  text: string;
  right: number;
  overflowPx: number;
}

/** An interactive element smaller than a comfortable finger. */
export interface SmallTarget {
  tag: string;
  label: string;
  width: number;
  height: number;
}

export interface RouteMeasurement {
  route: string;
  width: number;
  height: number;
  /** documentElement.scrollWidth — compare against `width`. */
  scrollWidth: number;
  documentOverflows: boolean;
  offenders: Offender[];
  /**
   * Elements whose CONTENT is wider than their own box.
   *
   * A separate signal from `offenders`, and not redundant: an unbreakable string
   * (an email, a URL) paints outside its box without changing that box's
   * bounding rect, so a rect-based scan cannot see it. This is what actually
   * localises "the document is 240px too wide" to the element to edit.
   */
  contentOverflows: Offender[];
  /** Below the WCAG 2.2 AA floor of 24x24 (SC 2.5.8). A real failure. */
  tinyTargets: SmallTarget[];
  /** Between 24 and 44 — AAA territory (SC 2.5.5). Reported, not failed. */
  smallTargets: SmallTarget[];
}

/**
 * WCAG 2.2 sizes. 24px is the normative AA minimum (SC 2.5.8 Target Size
 * (Minimum)); 44px is AAA (SC 2.5.5 Target Size (Enhanced)).
 *
 * Only the 24px floor is ever failed. A hard 44px gate would be permanently red
 * against the 36px navbar hamburger and the icon toggles in the admin product
 * list, and a gate that is always red gets ignored.
 */
export const TAP_TARGET_MIN = 24;
export const TAP_TARGET_COMFORTABLE = 44;

const INTERACTIVE_SELECTOR = [
  'a[href]',
  'button',
  'input:not([type="hidden"])',
  'select',
  'textarea',
  '[role="button"]',
  '[role="link"]',
].join(', ');

/**
 * Navigates and prepares the page for measurement.
 *
 * `overflow-x` is neutralised with an injected stylesheet rather than by changing
 * the app: `body { overflow-x: hidden }` clips horizontal overflow with no
 * scrollbar, so `documentElement.scrollWidth` would report no overflow even where
 * content is being cut off. Injected per-navigation via addStyleTag rather than
 * addInitScript, which races against document.head existing.
 *
 * Only the document-level measurement needs this — the per-element and tap-target
 * scans are geometric, so this helper keeps working whatever the app's CSS does.
 */
export async function visitRoute(page: Page, route: string): Promise<void> {
  await page.goto(route, { waitUntil: 'domcontentloaded' });
  await page.addStyleTag({
    content: 'html, body { overflow-x: visible !important; }',
  });
  // The scroll-frame heroes paint into a canvas after their images settle; give
  // layout a beat rather than racing the first paint.
  await page.waitForLoadState('networkidle').catch(() => {
    /* a long-polling request must not fail the audit */
  });
}

/**
 * Measures the current page at the current viewport.
 *
 * Runs entirely in the browser so it is one round trip regardless of DOM size.
 */
export async function measure(page: Page, route: string): Promise<RouteMeasurement> {
  const viewport = page.viewportSize();
  if (!viewport) throw new Error('measure() needs a fixed viewport size');

  const result = await page.evaluate(
    ({ interactiveSelector, tapMin, tapComfortable }) => {
      const vw = window.innerWidth;

      const rectOf = (el: Element) => el.getBoundingClientRect();
      const isRendered = (el: Element) => {
        const r = rectOf(el);
        if (r.width <= 0 || r.height <= 0) return false;
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || cs.display === 'none') return false;
        if (Number(cs.opacity) === 0) return false;
        return true;
      };

      /**
       * An element can only widen the document if EVERY ancestor up to the root
       * is overflow-visible. Anything inside a deliberate scroll or clip
       * container (the product thumbnail strip, an admin table's overflow-x-auto,
       * a decorative overflow-hidden image frame) is contained by design.
       *
       * This is what keeps the report actionable without a hand-maintained
       * ignore list.
       */
      const isContainedByAncestor = (el: Element): boolean => {
        let parent = el.parentElement;
        while (parent && parent !== document.documentElement) {
          const ox = getComputedStyle(parent).overflowX;
          if (ox !== 'visible') return true;
          parent = parent.parentElement;
        }
        return false;
      };

      const rawOffenders: Element[] = [];
      for (const el of Array.from(document.body.querySelectorAll('*'))) {
        if (!isRendered(el)) continue;
        const r = rectOf(el);
        // 1px of tolerance: sub-pixel layout rounding is not a bug.
        if (r.right <= vw + 1) continue;
        if (isContainedByAncestor(el)) continue;
        rawOffenders.push(el);
      }

      // Report only the outermost offender per subtree. A single wide element
      // drags every descendant over the edge; listing all of them buries the
      // one node worth editing.
      const outermost = rawOffenders.filter(
        (el) => !rawOffenders.some((other) => other !== el && other.contains(el))
      );

      const offenders = outermost
        .map((el) => {
          const r = rectOf(el);
          return {
            tag: el.tagName.toLowerCase(),
            id: el.id || '',
            classes: (el.getAttribute('class') || '').split(/\s+/).filter(Boolean).slice(0, 3).join(' '),
            text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40),
            right: Math.round(r.right),
            overflowPx: Math.round(r.right - vw),
          };
        })
        .sort((a, b) => b.overflowPx - a.overflowPx);

      const describe = (el: Element, right: number, overflowPx: number) => ({
        tag: el.tagName.toLowerCase(),
        id: el.id || '',
        classes: (el.getAttribute('class') || '').split(/\s+/).filter(Boolean).slice(0, 3).join(' '),
        text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40),
        right: Math.round(right),
        overflowPx: Math.round(overflowPx),
      });

      // Content wider than its own box. Unlike the rect scan above, keep the
      // INNERMOST offender: the chain of ancestors all report the same overflow,
      // but only the leaf actually holds the string that will not break.
      const rawContent: Element[] = [];
      for (const el of Array.from(document.body.querySelectorAll('*'))) {
        if (!isRendered(el)) continue;
        if (el.clientWidth <= 0) continue;
        if (getComputedStyle(el).overflowX !== 'visible') continue;
        if (el.scrollWidth > el.clientWidth + 1) rawContent.push(el);
      }
      const contentOverflows = rawContent
        .filter((el) => !rawContent.some((other) => other !== el && el.contains(other)))
        .map((el) =>
          describe(el, rectOf(el).right, el.scrollWidth - el.clientWidth)
        )
        .sort((a, b) => b.overflowPx - a.overflowPx);

      const tinyTargets: Array<{ tag: string; label: string; width: number; height: number }> = [];
      const smallTargets: typeof tinyTargets = [];

      for (const el of Array.from(document.querySelectorAll(interactiveSelector))) {
        if (!isRendered(el)) continue;
        const r = rectOf(el);
        const smallest = Math.min(r.width, r.height);
        if (smallest >= tapComfortable) continue;

        const entry = {
          tag: el.tagName.toLowerCase(),
          label:
            el.getAttribute('aria-label') ||
            (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 30) ||
            el.getAttribute('name') ||
            el.getAttribute('placeholder') ||
            '(unlabelled)',
          width: Math.round(r.width),
          height: Math.round(r.height),
        };
        if (smallest < tapMin) tinyTargets.push(entry);
        else smallTargets.push(entry);
      }

      return {
        scrollWidth: document.documentElement.scrollWidth,
        viewportWidth: vw,
        offenders,
        contentOverflows,
        tinyTargets,
        smallTargets,
      };
    },
    {
      interactiveSelector: INTERACTIVE_SELECTOR,
      tapMin: TAP_TARGET_MIN,
      tapComfortable: TAP_TARGET_COMFORTABLE,
    }
  );

  return {
    route,
    width: viewport.width,
    height: viewport.height,
    scrollWidth: result.scrollWidth,
    documentOverflows: result.scrollWidth > result.viewportWidth + 1,
    offenders: result.offenders,
    contentOverflows: result.contentOverflows,
    tinyTargets: result.tinyTargets,
    smallTargets: result.smallTargets,
  };
}

/** Human-readable block for the HTML report attachment. */
export function formatMeasurement(m: RouteMeasurement): string {
  const lines: string[] = [
    `${m.route}  @ ${m.width}x${m.height}`,
    `  document scrollWidth ${m.scrollWidth} vs viewport ${m.width}` +
      (m.documentOverflows ? `  >>> OVERFLOWS by ${m.scrollWidth - m.width}px` : '  ok'),
  ];

  if (m.offenders.length) {
    lines.push(`  ${m.offenders.length} element(s) past the right edge:`);
    for (const o of m.offenders) {
      const id = o.id ? `#${o.id}` : '';
      lines.push(
        `    +${o.overflowPx}px  <${o.tag}${id} class="${o.classes}">  ${JSON.stringify(o.text)}`
      );
    }
  }

  if (m.contentOverflows.length) {
    lines.push(`  ${m.contentOverflows.length} element(s) whose content is wider than their box:`);
    for (const o of m.contentOverflows) {
      const id = o.id ? `#${o.id}` : '';
      lines.push(
        `    +${o.overflowPx}px  <${o.tag}${id} class="${o.classes}">  ${JSON.stringify(o.text)}`
      );
    }
  }

  if (m.tinyTargets.length) {
    lines.push(`  ${m.tinyTargets.length} tap target(s) under ${TAP_TARGET_MIN}px (WCAG 2.2 AA):`);
    for (const t of m.tinyTargets) {
      lines.push(`    ${t.width}x${t.height}  <${t.tag}>  ${JSON.stringify(t.label)}`);
    }
  }

  if (m.smallTargets.length) {
    lines.push(
      `  ${m.smallTargets.length} tap target(s) ${TAP_TARGET_MIN}-${TAP_TARGET_COMFORTABLE}px (AAA advisory)`
    );
  }

  return lines.join('\n');
}
