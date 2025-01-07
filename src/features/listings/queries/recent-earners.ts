import { queryOptions } from '@tanstack/react-query';

import { type User } from '@/interface/user';
import { api } from '@/lib/api';

const fetchRecentEarners = async (): Promise<User[]> => {
  const response = await api.get('/api/sidebar/recent-earners');
  return response.data;
};

export const recentEarnersQuery = queryOptions({
  queryKey: ['recentEarners'],
  queryFn: fetchRecentEarners,
  staleTime: 1000 * 60 * 60,
  gcTime: 1000 * 60 * 60 * 2,
});
