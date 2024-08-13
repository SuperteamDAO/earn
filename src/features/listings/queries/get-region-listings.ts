import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

import { type GrantWithApplicationCount } from '@/features/grants';

import { type Listing } from '../types';

interface FetchRegionListingsParams {
  region: string;
  take?: number;
}

interface Listings {
  bounties?: Listing[];
  grants?: GrantWithApplicationCount[];
}

const fetchRegionListings = async (
  params: FetchRegionListingsParams,
): Promise<Listings> => {
  const { data } = await axios.get('/api/listings/regions/', { params });
  return data;
};

export const useGetRegionListings = (params: FetchRegionListingsParams) => {
  return useQuery({
    queryKey: ['regionListings', params],
    queryFn: () => fetchRegionListings(params),
  });
};
