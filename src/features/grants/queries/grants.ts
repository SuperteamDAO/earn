import { queryOptions } from '@tanstack/react-query';
import axios from 'axios';

import { type GrantWithApplicationCount } from '@/features/grants';

interface GetGrantsParams {
  order?: 'asc' | 'desc';
  filter?: string;
  take?: number;
  excludeIds?: string[];
}

const fetchGrants = async (
  params: GetGrantsParams = {},
): Promise<GrantWithApplicationCount[]> => {
  const { data } = await axios.get('/api/grants/', { params });
  return data;
};

export const grantsQuery = (params: GetGrantsParams) =>
  queryOptions({
    queryKey: ['grants', params],
    queryFn: () => fetchGrants(params),
  });
