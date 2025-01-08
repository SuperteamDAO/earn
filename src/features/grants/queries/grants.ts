import { queryOptions } from '@tanstack/react-query';

import { api } from '@/lib/api';

import { type GrantWithApplicationCount } from '@/features/grants/types';

interface GetGrantsParams {
  order?: 'asc' | 'desc';
  filter?: string;
  take?: number;
  excludeIds?: string[];
}

const fetchGrants = async (
  params: GetGrantsParams = {},
): Promise<GrantWithApplicationCount[]> => {
  const { data } = await api.get('/api/grants/', { params });
  return data;
};

export const grantsQuery = (params: GetGrantsParams) =>
  queryOptions({
    queryKey: ['grants', params],
    queryFn: () => fetchGrants(params),
  });
