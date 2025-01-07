import { queryOptions } from '@tanstack/react-query';

import { api } from '@/lib/api';

import { type GrantWithApplicationCount } from '@/features/grants/types';

interface GrantsParams {
  userRegion: string[] | null;
}

const fetchHomePageGrants = async (
  params: GrantsParams,
): Promise<GrantWithApplicationCount[]> => {
  const { data } = await api.get('/api/homepage/grants/', {
    params,
  });
  return data;
};

export const homepageGrantsQuery = (params: GrantsParams) =>
  queryOptions({
    queryKey: ['homepage-grants', params],
    queryFn: () => fetchHomePageGrants(params),
  });
