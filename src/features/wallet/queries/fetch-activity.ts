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
  staleTime: 30000,
  refetchInterval: 60000,
});
