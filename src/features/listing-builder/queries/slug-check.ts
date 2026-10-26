'use client';

import { useSetAtom } from 'jotai';
import { useEffect, useState } from 'react';

import { getJson, RequestError } from '@/lib/fetch-json';

import { slugCheckingAtom } from '../atoms';

interface SlugCheckParams {
  slug: string;
  check: boolean;
  id?: string | null;
}

interface SlugCheckResponse {
  slugExists?: boolean;
  slug?: string;
}

const STALE_MS = 5 * 60 * 1000;
const cache = new Map<string, { at: number; data: SlugCheckResponse }>();

const keyOf = ({ slug, check, id }: SlugCheckParams) =>
  JSON.stringify([slug, check, id ?? null]);

// Earn's check-slug: with `check`, whether the slug is free (a taken one
// answers 400 with slugExists); without, a free slug made from it.
async function fetchSlugCheck(
  params: SlugCheckParams,
  signal?: AbortSignal,
): Promise<SlugCheckResponse> {
  const key = keyOf(params);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < STALE_MS) return cached.data;
  const search = new URLSearchParams({
    slug: params.slug,
    check: String(params.check),
  });
  if (params.id) search.set('id', params.id);
  const data = await getJson<SlugCheckResponse>(
    `/api/sponsor-dashboard/listing/check-slug/?${search}`,
    signal,
  ).catch((error: unknown) => {
    if (
      error instanceof RequestError &&
      error.status === 400 &&
      typeof error.body === 'object' &&
      error.body !== null &&
      'slugExists' in error.body &&
      error.body.slugExists === true
    ) {
      return { slugExists: true };
    }
    throw error;
  });
  cache.set(key, { at: Date.now(), data });
  return data;
}

// A slug check while `enabled`, counted in slugCheckingAtom while it runs.
// Like a query: `data` is the answer for these params, once it's in.
export function useSlugCheck(params: SlugCheckParams, enabled: boolean) {
  const setChecking = useSetAtom(slugCheckingAtom);
  const { slug, check, id } = params;
  const key = keyOf({ slug, check, id });
  const [result, setResult] = useState<{
    key: string;
    data?: SlugCheckResponse;
    isError: boolean;
  } | null>(null);

  useEffect(() => {
    if (!enabled) return undefined;
    const controller = new AbortController();
    const requested = keyOf({ slug, check, id });
    setChecking((count) => count + 1);
    fetchSlugCheck({ slug, check, id }, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setResult({ key: requested, data, isError: false });
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setResult({ key: requested, isError: true });
        }
      })
      .finally(() => {
        setChecking((count) => Math.max(0, count - 1));
      });
    return () => {
      controller.abort();
    };
  }, [enabled, slug, check, id, setChecking]);

  const current = result?.key === key ? result : null;
  return {
    data: current?.data,
    isError: current?.isError ?? false,
    isFetching: enabled && !current,
  };
}
