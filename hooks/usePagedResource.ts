'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Fetches a paginated admin endpoint, with debounced filters and real error
 * state.
 *
 * Extracted so the admin tables share one implementation of the parts that are
 * easy to get subtly wrong: aborting in-flight requests when filters change,
 * not reporting an abort as a failure, resetting to page 1 when a filter moves,
 * and setting `loading` from the user event rather than synchronously inside the
 * effect (which triggers react-hooks/set-state-in-effect and cascading renders).
 *
 * Replaces `.catch(console.error)`, which left the table looking empty when the
 * request had actually failed.
 */
/** Envelope every paginated admin endpoint returns around its rows. */
export interface PagedResponse {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface UsePagedResourceOptions {
  /** Endpoint path, e.g. '/api/admin/users'. */
  endpoint: string;
  /** Non-paging query params. Changing any of these resets to page 1. */
  filters: Record<string, string>;
  /** Debounce applied before refetching, for text inputs. */
  debounceMs?: number;
}

export function usePagedResource<T extends PagedResponse>({
  endpoint,
  filters,
  debounceMs = 300,
}: UsePagedResourceOptions) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [reloadToken, setReloadToken] = useState(0);

  // Serialise so the effect depends on the values, not the object identity.
  const filterKey = JSON.stringify(filters);
  const [debouncedKey, setDebouncedKey] = useState(filterKey);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedKey(filterKey), debounceMs);
    return () => clearTimeout(t);
  }, [filterKey, debounceMs]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    const parsed = JSON.parse(debouncedKey) as Record<string, string>;
    const params = new URLSearchParams({ page: String(page) });
    for (const [k, v] of Object.entries(parsed)) if (v) params.set(k, v);

    (async () => {
      try {
        const res = await fetch(`${endpoint}?${params}`, { signal: controller.signal });
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        const payload = (await res.json()) as T;
        if (active) {
          setData(payload);
          setError('');
        }
      } catch (err) {
        // An abort is us cancelling a superseded request, not a failure.
        if (active && !controller.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Could not load data.');
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
      controller.abort();
    };
  }, [endpoint, debouncedKey, page, reloadToken]);

  /** Wrap any filter change so the spinner and page reset happen in one event. */
  const applyFilters = useCallback((update: () => void, resetPage = true) => {
    setLoading(true);
    update();
    if (resetPage) setPage(1);
  }, []);

  const reload = useCallback(() => {
    setLoading(true);
    setReloadToken((t) => t + 1);
  }, []);

  const goToPage = useCallback((next: number) => {
    setLoading(true);
    setPage(next);
  }, []);

  return { data, loading, error, page, applyFilters, reload, goToPage };
}
