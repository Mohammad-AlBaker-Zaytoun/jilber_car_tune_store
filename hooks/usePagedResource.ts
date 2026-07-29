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

/**
 * Page and filters travel together in ONE state object.
 *
 * They used to be separate: `page` was a raw effect dependency while the filters
 * arrived via a 300ms-debounced key. Changing a filter while on page 3 therefore
 * moved `page` 3 -> 1 immediately, firing a fetch with the PREVIOUS filters,
 * and only 300ms later did a second fetch with the correct ones — a wasted round
 * trip and a visible flash of the wrong rows.
 */
interface Query {
  key: string;
  page: number;
}

export function usePagedResource<T extends PagedResponse>({
  endpoint,
  filters,
  debounceMs = 300,
}: UsePagedResourceOptions) {
  const filterKey = JSON.stringify(filters);

  const [data, setData] = useState<T | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);
  const [query, setQuery] = useState<Query>({ key: filterKey, page: 1 });

  /**
   * `loading` is DERIVED, not stored.
   *
   * Storing it meant the spinner could stick on forever: type a character and
   * delete it inside the debounce window and the filter returns to its current
   * value, so no fetch is ever scheduled and nothing clears the flag. Deriving
   * it from "filters not yet applied, or a request in flight" makes that state
   * unrepresentable.
   */
  const loading = fetching || filterKey !== query.key;

  // A filter change resets to page 1 and is debounced, so typing does not fire a
  // request per keystroke. Paging is immediate (see goToPage).
  useEffect(() => {
    if (filterKey === query.key) return;
    const t = setTimeout(() => {
      // Flip `fetching` in the same tick as the query so there is no frame where
      // filters are applied but the request has not started and loading reads false.
      setFetching(true);
      setQuery({ key: filterKey, page: 1 });
    }, debounceMs);
    return () => clearTimeout(t);
  }, [filterKey, query.key, debounceMs]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    const parsed = JSON.parse(query.key) as Record<string, string>;
    const params = new URLSearchParams({ page: String(query.page) });
    for (const [k, v] of Object.entries(parsed)) if (v) params.set(k, v);

    (async () => {
      try {
        const res = await fetch(`${endpoint}?${params}`, { signal: controller.signal });
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        const payload = (await res.json()) as T;
        if (!active) return;

        setData(payload);
        setError('');

        // Deleting the last row on the last page leaves the operator stranded on
        // "Page 4 of 3" with an empty table and a disabled Next button.
        if (payload.totalPages > 0 && query.page > payload.totalPages) {
          setQuery((q) => ({ ...q, page: payload.totalPages }));
        }
      } catch (err) {
        // An abort is us cancelling a superseded request, not a failure.
        if (active && !controller.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Could not load data.');
        }
      } finally {
        if (active) setFetching(false);
      }
    })();

    return () => {
      active = false;
      controller.abort();
    };
  }, [endpoint, query, reloadToken]);

  /**
   * Applies a filter change. Does NOT touch loading — the derived value above
   * already reports "pending" the moment `filters` differs from the applied
   * query, which is exactly the debounce window.
   */
  const applyFilters = useCallback((update: () => void) => update(), []);

  const reload = useCallback(() => {
    setFetching(true);
    setReloadToken((t) => t + 1);
  }, []);

  const goToPage = useCallback((next: number) => {
    setFetching(true);
    setQuery((q) => ({ ...q, page: next }));
  }, []);

  return { data, loading, error, page: query.page, applyFilters, reload, goToPage };
}
