import { queryOptions } from '@tanstack/react-query';
import axios from 'axios';

import { type Listing } from '../types';

interface ListingsParams {
  take?: number;
  filter?: string;
  deadline?: string;
  type?: 'bounty' | 'project';
  isHomePage?: boolean;
  order?: 'asc' | 'desc';
  excludeIds?: string[];
}

const fetchListings = async (params: ListingsParams): Promise<Listing[]> => {
  const { data } = await axios.get('/api/listings/', { params });
  return data;
};

export const listingsQuery = (params: ListingsParams) =>
  queryOptions({
    queryKey: ['listings', params],
    queryFn: () => fetchListings(params),
  });
