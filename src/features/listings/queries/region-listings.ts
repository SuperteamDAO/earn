import { queryOptions } from '@tanstack/react-query';

import { api } from '@/lib/api';

import { type GrantWithApplicationCount } from '@/features/grants/types';

import { type Listing } from '../types';

interface RegionListingsParams {
  region: string;
  take?: number;
}

interface Listings {
  bounties?: Listing[];
  grants?: GrantWithApplicationCount[];
}

const fetchRegionListings = async (
  params: RegionListingsParams,
): Promise<Listings> => {
  const { data } = await api.get('/api/listings/regions/', { params });
  return data;
};

export const regionalListingsQuery = (params: RegionListingsParams) =>
  queryOptions({
    queryKey: ['regionListings', params],
    queryFn: () => fetchRegionListings(params),
  });
