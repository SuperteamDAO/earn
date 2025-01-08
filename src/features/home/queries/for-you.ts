import { queryOptions } from '@tanstack/react-query';

import { api } from '@/lib/api';

import { type Listing } from '@/features/listings/types';

interface ListingsParams {
  statusFilter: 'open' | 'review' | 'completed';
  order?: 'asc' | 'desc';
}

const fetchHomePageForYouListings = async (
  params: ListingsParams,
): Promise<Listing[]> => {
  const { data } = await api.get('/api/homepage/for-you/', { params });
  return data;
};

export const homepageForYouListingsQuery = (params: ListingsParams) =>
  queryOptions({
    queryKey: ['homepage-for-you-listings', params],
    queryFn: () => fetchHomePageForYouListings(params),
  });
