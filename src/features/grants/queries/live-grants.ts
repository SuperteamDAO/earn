import { queryOptions } from '@tanstack/react-query';

import { api } from '@/lib/api';

import { type GrantWithApplicationCount } from '@/features/grants/types';

interface GetGrantsParams {
  take?: number;
  excludeIds?: string[];
}

const fetchLiveGrants = async (
  params: GetGrantsParams = {},
): Promise<GrantWithApplicationCount[]> => {
  const { data } = await api.get('/api/grants/live', { params });
  return data;
};

export const liveGrantsQuery = (params: GetGrantsParams) =>
  queryOptions({
    queryKey: ['live-grants', params],
    queryFn: () => fetchLiveGrants(params),
  });
