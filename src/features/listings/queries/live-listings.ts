import { queryOptions } from '@tanstack/react-query';

import { api } from '@/lib/api';

import { type Listing } from '../types';

interface ListingsParams {
  take?: number;
  deadline?: string;
  type?: 'bounty' | 'project' | 'hackathon';
  order?: 'asc' | 'desc';
  excludeIds?: string[];
  exclusiveSponsorId?: string;
}

const fetchLiveListings = async (
  params: ListingsParams,
): Promise<Listing[]> => {
  const { data } = await api.get('/api/listings/live', { params });
  return data;
};

export const liveListingsQuery = (params: ListingsParams) =>
  queryOptions({
    queryKey: ['live-listings', params],
    queryFn: () => fetchLiveListings(params),
  });
