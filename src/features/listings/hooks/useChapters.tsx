'use client';

import { createContext, useContext, useEffect, useState } from 'react';

import type { ChapterRegionData } from '@/interface/chapter';
import { getJson } from '@/lib/fetch-json';

const ChaptersContext = createContext<Array<ChapterRegionData> | null>(null);

// Earn's chapters, loaded with the page on the server.
export function ChaptersProvider({
  chapters,
  children,
}: {
  chapters: Array<ChapterRegionData>;
  children: React.ReactNode;
}) {
  return <ChaptersContext value={chapters}>{children}</ChaptersContext>;
}

let loading: Promise<Array<ChapterRegionData>> | null = null;

// The chapters for region labels and checks: the page's, or (on a page that
// didn't load them) fetched once.
export function useChapters(): Array<ChapterRegionData> {
  const provided = useContext(ChaptersContext);
  const [fetched, setFetched] = useState<Array<ChapterRegionData>>([]);
  useEffect(() => {
    if (provided) return undefined;
    let live = true;
    loading ??= getJson<{ chapters: Array<ChapterRegionData> }>(
      '/api/chapters/',
    )
      .then((data) => data.chapters)
      .catch(() => {
        loading = null;
        return [];
      });
    void loading.then((chapters) => {
      if (live) setFetched(chapters);
    });
    return () => {
      live = false;
    };
  }, [provided]);
  return provided ?? fetched;
}
