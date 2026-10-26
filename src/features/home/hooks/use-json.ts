'use client';

import { useEffect, useState } from 'react';

import { getJson } from '@/lib/fetch-json';

interface Answer<T> {
  readonly url: string;
  readonly data: T;
  // When it arrived, for deadline text.
  readonly at: number;
}

// A GET route handler's answer for widgets that other areas' client pages
// render (they can't load it on the server for them). Nothing while
// loading or after a failure; `url` null skips the request.
// oxlint-disable-next-line typescript/no-unnecessary-type-parameters -- the caller names the handler's answer, as getJson's do
export function useJson<T>(url: string | null): {
  readonly data: T | undefined;
  readonly at: number;
} {
  const [answer, setAnswer] = useState<Answer<T> | null>(null);
  useEffect(() => {
    if (!url) return () => {};
    const controller = new AbortController();
    getJson<T>(url, controller.signal)
      .then((data) => setAnswer({ url, data, at: Date.now() }))
      .catch(() => undefined);
    return () => controller.abort();
  }, [url]);
  return answer && answer.url === url
    ? { data: answer.data, at: answer.at }
    : { data: undefined, at: 0 };
}

// Earn's axios-style query string: arrays as `key[]=a&key[]=b`.
export function queryString(
  params: Record<string, string | number | ReadonlyArray<string> | undefined>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    if (typeof value === 'object') {
      for (const item of value) search.append(`${key}[]`, item);
    } else {
      search.set(key, String(value));
    }
  }
  return search.toString();
}
