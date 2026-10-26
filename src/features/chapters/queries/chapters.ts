'use client';

import { useEffect, useState } from 'react';

import type { ChapterRegionData } from '@/interface/chapter';
import { getJson } from '@/lib/fetch-json';

// Earn's chaptersQuery without react-query: every active chapter from
// `/api/chapters/`, shared by every picker on the page and kept five
// minutes, as its staleTime did. A failure isn't kept: the next picker asks
// again.
const STALE_MS = 5 * 60 * 1000;

let cache: {
  readonly at: number;
  readonly request: Promise<ChapterRegionData[]>;
} | null = null;

function fetchChapters(): Promise<ChapterRegionData[]> {
  if (cache && Date.now() - cache.at < STALE_MS) return cache.request;
  const request = getJson<{ chapters: ChapterRegionData[] }>(
    '/api/chapters/',
  ).then((body) => body.chapters);
  const entry = { at: Date.now(), request };
  cache = entry;
  request.catch(() => {
    if (cache === entry) cache = null;
  });
  return request;
}

export function useChapters(): ChapterRegionData[] {
  const [chapters, setChapters] = useState<ChapterRegionData[]>([]);
  useEffect(() => {
    let live = true;
    fetchChapters()
      .then((list) => {
        if (live) setChapters(list);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);
  return chapters;
}
