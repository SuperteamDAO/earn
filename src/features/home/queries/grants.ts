import { queryOptions } from '@tanstack/react-query';

import { api } from '@/lib/api';

import { type GrantWithApplicationCount } from '@/features/grants/types';

const fetchHomePageGrants = async (): Promise<GrantWithApplicationCount[]> => {
  const { data } = await api.get('/api/homepage/grants/');
  return data;
};

export const homepageGrantsQuery = queryOptions({
  queryKey: ['homepage-grants'],
  queryFn: () => fetchHomePageGrants(),
});
