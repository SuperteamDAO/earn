import { queryOptions } from '@tanstack/react-query';
import axios from 'axios';

import { type User } from '@/interface/user';

const fetchRecentEarners = async (): Promise<User[]> => {
  const response = await axios.get('/api/sidebar/recent-earners');
  return response.data;
};

export const recentEarnersQuery = queryOptions({
  queryKey: ['recentEarners'],
  queryFn: fetchRecentEarners,
  staleTime: 1000 * 60 * 60,
  gcTime: 1000 * 60 * 60 * 2,
});
