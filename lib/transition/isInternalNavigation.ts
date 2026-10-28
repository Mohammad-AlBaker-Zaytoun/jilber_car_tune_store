/**
 * Route prefixes that get the LIGHT transition instead of the cinematic one.
 *
 * The admin panel is a working tool, not a showcase. A 900 ms frame-sequence
 * overlay between every list and detail view is friction for someone processing
 * a queue of orders, and it costs 5.4 MB of frames they never asked for. These
 * routes still animate — just a fast, cheap fade. The storefront keeps the full
 * treatment, which is where it earns its place.
 *
 * Applied to BOTH ends of a navigation: entering and leaving the admin panel are
 * equally not moments for a flourish, and matching only the destination would
 * still play the cinematic version on the way out.
 */
const LIGHT_TRANSITION_PREFIXES = ['/admin'] as const;

/** True when a pathname is one of those routes, or nested beneath it. */
export function isLightTransitionArea(pathname: string): boolean {
  return LIGHT_TRANSITION_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

/**
 * Returns true if a click on the given anchor warrants a page-transition animation.
 *
 * Excluded cases:
 *  - modifier-key clicks (ctrl/cmd/shift/alt) → browser handles (new tab, etc.)
 *  - non-left-click (middle-click, right-click)
 *  - target="_blank" or named frames
 *  - external origins
 *  - protocol links (mailto:, tel:, blob:, javascript:, ftp:, data:)
 *  - hash-only hrefs (#section) – same-page scroll
 *  - same pathname (hash change or query-only change on the current page)
 *  - Next.js system paths (/_next/, /api/)
 *  - paths that look like file downloads (have a file extension)
 *  - anchors with data-no-transition attribute
 *
 * Note this says nothing about WHICH animation plays. Admin routes still
 * intercept; PageTransitionProvider picks the light variant for them via
 * isLightTransitionArea().
 */
export function shouldInterceptNavigation(
  anchor: HTMLAnchorElement,
  event: MouseEvent,
  currentPathname: string
): boolean {
  // Modifier keys → browser's built-in behaviour (new tab, download, etc.)
  if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return false;

  // Only intercept primary (left) button clicks
  if (event.button !== 0) return false;

  // Explicit opt-out
  if (anchor.hasAttribute('data-no-transition')) return false;

  // target="_blank" or any named frame that isn't the current one
  const target = anchor.target;
  if (target && target !== '_self') return false;

  const href = anchor.getAttribute('href') ?? '';

  // Empty href or hash-only (same-page scroll)
  if (!href || href.startsWith('#')) return false;

  // Protocol links
  if (/^(mailto:|tel:|blob:|javascript:|ftp:|data:)/i.test(href)) return false;

  // Absolute URLs — only same origin may pass
  if (/^(https?:)?\/\//i.test(href)) {
    try {
      const url = new URL(href);
      if (url.origin !== window.location.origin) return false;
      // Same-origin absolute URL: fall through to pathname checks
    } catch {
      return false;
    }
  }

  // Next.js system paths and API routes
  if (href.startsWith('/_next/') || href.startsWith('/api/')) return false;

  try {
    const url = new URL(href, window.location.href);

    // Same pathname → only hash/query change on the current page
    if (url.pathname === currentPathname) return false;

    // Looks like a static-asset or download (has a file extension)
    if (/\.[a-z0-9]{1,5}$/i.test(url.pathname)) return false;

    return true;
  } catch {
    return false;
  }
}
