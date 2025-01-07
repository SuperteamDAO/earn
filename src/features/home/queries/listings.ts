import { queryOptions } from '@tanstack/react-query';

import { api } from '@/lib/api';

import { type Listing } from '@/features/listings/types';

interface ListingsParams {
  order?: 'asc' | 'desc';
  statusFilter: 'open' | 'review' | 'completed';
  userRegion: string[] | null;
  excludeIds?: string[];
}

const fetchHomePageListings = async (
  params: ListingsParams,
): Promise<Listing[]> => {
  const { data } = await api.get('/api/homepage/listings/', { params });
  return data;
};

export const homepageListingsQuery = (params: ListingsParams) =>
  queryOptions({
    queryKey: ['homepage-listings', params],
    queryFn: () => fetchHomePageListings(params),
  });
