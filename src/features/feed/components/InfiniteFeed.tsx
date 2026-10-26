'use client';

import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useInView } from 'react-intersection-observer';

import { getJson } from '@/lib/fetch-json';

import type { FeedDataProps, FeedPostType } from '../types';
import { FeedLoop } from './FeedLoop';

export interface FeedListQuery {
  readonly filter?: 'new' | 'popular';
  readonly timePeriod?: string;
  readonly isWinner?: boolean;
  readonly take: number;
  readonly userId?: string;
  readonly highlightId?: string;
  readonly highlightType?: FeedPostType;
  readonly takeOnlyType?: FeedPostType;
}

const feedUrl = (query: FeedListQuery, skip: number) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  params.set('skip', String(skip));
  return `/api/feed/get/?${params.toString()}`;
};

interface Props {
  // The first page, loaded with the page; fetched here when absent.
  initial?: FeedDataProps[];
  query: FeedListQuery;
  type: 'activity' | 'profile';
  // Shown when there's nothing.
  children: ReactNode;
}

// A feed that loads more as it scrolls, as Earn's useGetFeed did: pages of
// `take`, until a page comes back empty. Give it a new `key` for a new query.
export function InfiniteFeed({ initial, query, type, children }: Props) {
  const [items, setItems] = useState<FeedDataProps[]>(initial ?? []);
  const [pages, setPages] = useState(initial ? 1 : 0);
  const [hasNextPage, setHasNextPage] = useState(
    initial ? initial.length > 0 : true,
  );
  const [isLoading, setIsLoading] = useState(!initial);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
  const busy = useRef(false);
  const { ref, inView } = useInView();

  const load = useCallback(
    async (page: number) => {
      if (busy.current) return;
      busy.current = true;
      if (page > 0) setIsFetchingNextPage(true);
      try {
        const next = await getJson<FeedDataProps[]>(
          feedUrl(query, page * query.take),
        );
        setItems((current) => (page === 0 ? next : [...current, ...next]));
        setPages(page + 1);
        setHasNextPage(next.length > 0);
      } catch {
        setHasNextPage(false);
      } finally {
        busy.current = false;
        setIsLoading(false);
        setIsFetchingNextPage(false);
      }
    },
    [query],
  );

  useEffect(() => {
    if (!initial) void load(0);
    // The first page only, once; a new query gets a new component.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (inView && hasNextPage && pages > 0) void load(pages);
  }, [inView, hasNextPage, pages, load]);

  return (
    <FeedLoop
      feed={items}
      ref={ref}
      isFetchingNextPage={isFetchingNextPage}
      isLoading={isLoading}
      type={type}
    >
      {children}
    </FeedLoop>
  );
}
