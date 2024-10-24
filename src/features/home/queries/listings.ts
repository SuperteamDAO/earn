import { queryOptions } from '@tanstack/react-query';
import axios from 'axios';

import { type Listing } from '@/features/listings';

interface ListingsParams {
  order?: 'asc' | 'desc';
  statusFilter: 'open' | 'review' | 'completed';
  userRegion: string[] | null;
  excludeIds?: string[];
}

const fetchHomePageListings = async (
  params: ListingsParams,
): Promise<Listing[]> => {
  const { data } = await axios.get('/api/homepage/listings/', { params });
  return data;
};

export const homepageListingsQuery = (params: ListingsParams) =>
  queryOptions({
    queryKey: ['homepage-listings', params],
    queryFn: () => fetchHomePageListings(params),
  });
