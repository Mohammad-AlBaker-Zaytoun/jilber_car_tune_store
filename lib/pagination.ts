/**
 * Client-side page slicing for the storefront grid.
 *
 * Rendering every matching card at once meant thousands of <Link>/<Image>
 * trees in the server HTML and on hydration. The filtered list is still
 * computed over the whole catalogue (so search finds everything); only the
 * visible page is rendered.
 */
export const STORE_PAGE_SIZE = 24;

export interface Page<T> {
  items: T[];
  /** 1-based, clamped into [1, totalPages]. */
  page: number;
  totalPages: number;
  total: number;
}

export function paginate<T>(list: readonly T[], page: number, size = STORE_PAGE_SIZE): Page<T> {
  const safeSize = Math.max(1, Math.floor(size));
  const totalPages = Math.max(1, Math.ceil(list.length / safeSize));
  const p = Number.isFinite(page) ? Math.min(Math.max(1, Math.floor(page)), totalPages) : 1;
  const start = (p - 1) * safeSize;
  return { items: list.slice(start, start + safeSize), page: p, totalPages, total: list.length };
}

/**
 * Page numbers to show around the current one, with `null` marking a gap:
 * [1, null, 6, 7, 8, null, 40]. Always includes the first and last page.
 */
export function pageWindow(page: number, totalPages: number, radius = 1): (number | null)[] {
  if (totalPages <= 1) return [1];
  const pages = new Set<number>([1, totalPages]);
  for (let i = page - radius; i <= page + radius; i++) if (i >= 1 && i <= totalPages) pages.add(i);
  const sorted = [...pages].sort((a, b) => a - b);
  const out: (number | null)[] = [];
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1] > 1) out.push(null);
    out.push(n);
  });
  return out;
}
