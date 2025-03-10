import { queryOptions } from '@tanstack/react-query';

import { api } from '@/lib/api';

import { type TokenActivity } from '../types/TokenActivity';

const fetchTokenActivityFn = async (): Promise<TokenActivity[]> => {
  const { data } = await api.get<TokenActivity[]>('/api/wallet/activity');
  return data;
};

export const tokenActivityQuery = queryOptions({
  queryKey: ['wallet', 'activity'],
  queryFn: fetchTokenActivityFn,
  staleTime: Infinity,
  gcTime: 1000 * 60 * 60 * 24,
  refetchOnWindowFocus: false,
  refetchOnMount: false,
});
