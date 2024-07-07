import axios from 'axios';
import type { NextRouter } from 'next/router';
import type { TransitionStartFunction } from 'react';

import { type Listing } from '@/features/listings';
import logger from '@/lib/logger';

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
  offsetId?: string;
  status?: string;
  skills?: string;
  offset?: number;
}
export async function search(query: string, params?: SearchQuery) {
  try {
    if (query.length > 0) {
      const resp = await axios.get(`/api/search/${encodeURIComponent(query)}`, {
        params: {
          limit: 10,
          ...params,
        },
      });
      return resp.data as { bounties: Listing[]; count: number };
    } else return undefined;
  } catch (err) {
    logger.error('search failed - ', err);
    return undefined;
  }
}
