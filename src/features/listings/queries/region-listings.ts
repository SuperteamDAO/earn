import { queryOptions } from '@tanstack/react-query';
import axios from 'axios';

import { type GrantWithApplicationCount } from '@/features/grants';

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
  const { data } = await axios.get('/api/listings/regions/', { params });
  return data;
};

export const regionalListingsQuery = (params: RegionListingsParams) =>
  queryOptions({
    queryKey: ['regionListings', params],
    queryFn: () => fetchRegionListings(params),
  });
