'use client';

import { useEffect, useState } from 'react';

import { getJson } from '@/lib/fetch-json';

import type { SearchPage, SearchResult } from '../types';

interface Answer {
  readonly query: string;
  readonly results: ReadonlyArray<SearchResult>;
  readonly now: number;
}

// The search modal's first few matches for `query`, fetched as they type
// (debounced by the caller).
export function useSearchTypeahead(query: string) {
  const trimmed = query.trim();
  const [answer, setAnswer] = useState<Answer | null>(null);

  useEffect(() => {
    if (!trimmed) return () => {};
    const controller = new AbortController();
    getJson<SearchPage>(
      `/api/search/${encodeURIComponent(trimmed)}/?bountiesLimit=5&grantsLimit=2`,
      controller.signal,
    )
      .then((page) =>
        setAnswer({ query: trimmed, results: page.results, now: Date.now() }),
      )
      .catch(() => undefined);
    return () => controller.abort();
  }, [trimmed]);

  if (!trimmed) return { results: [], isFetching: false, now: 0 };
  return {
    results: answer?.results ?? [],
    isFetching: answer?.query !== trimmed,
    now: answer?.now ?? 0,
  };
}
