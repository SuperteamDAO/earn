import axios from 'axios';
import type { NextRouter } from 'next/router';
import type { TransitionStartFunction } from 'react';

import logger from '@/lib/logger';

import { type SearchResult } from '../types';

export function serverSearch(
  startTransition: TransitionStartFunction,
  router: NextRouter,
  q: string,
  filter?: { status?: string; skills?: string },
) {
  const url = new URL(window.location.href);
  // if (url.searchParams.get('q')?.trim() === query ) return
  url.searchParams.set('q', q);

  if (filter) {
    if (filter.status) {
      url.searchParams.set('status', filter.status);
    } else {
      url.searchParams.delete('status');
    }
    if (filter.skills) {
      url.searchParams.set('skills', filter.skills);
    } else {
      url.searchParams.delete('skills');
    }
  }

  startTransition(() => {
    router.replace(`?${url.searchParams.toString()}`);
  });
}

interface SearchQuery {
  status?: string;
  skills?: string;
  bountiesOffset?: number;
  grantsOffset?: number;
}
export async function search(query: string, params?: SearchQuery) {
  try {
    if (query.length > 0) {
      const resp = await axios.get(`/api/search/${encodeURIComponent(query)}`, {
        params: {
          bountiesLimit: 10,
          grantsLimit: 3,
          ...params,
        },
      });
      return resp.data as {
        results: SearchResult[];
        count: number;
        bountiesCount: number;
        grantsCount: number;
      };
    } else return undefined;
  } catch (err) {
    logger.error('search failed - ', err);
    return undefined;
  }
}
