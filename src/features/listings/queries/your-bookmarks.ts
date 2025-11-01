import { queryOptions } from '@tanstack/react-query';

import { api } from '@/lib/api';

import { type Listing } from '../types';

interface ListingsParams {
  take?: number;
}

const fetchYourBookmarks = async (
  params: ListingsParams,
): Promise<Listing[]> => {
  const { data } = await api.get('/api/listings/bookmarks', { params });
  return data;
};

export const yourBookmarksQuery = (params: ListingsParams) =>
  queryOptions({
    queryKey: ['your-bookmarks', params],
    queryFn: () => fetchYourBookmarks(params),
  });
