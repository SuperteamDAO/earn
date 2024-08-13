import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

import { type Listing } from '../types';

interface FetchListingsParams {
  take?: number;
  filter?: string;
  deadline?: string;
  type?: 'bounty' | 'project';
  isHomePage?: boolean;
  order?: 'asc' | 'desc';
}

const fetchListings = async (
  params: FetchListingsParams,
): Promise<Listing[]> => {
  const { data } = await axios.get('/api/listings/', { params });
  return data;
};

export const useGetListings = (params: FetchListingsParams) => {
  return useQuery({
    queryKey: ['listings', params],
    queryFn: () => fetchListings(params),
  });
};
