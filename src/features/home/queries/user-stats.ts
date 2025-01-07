import { queryOptions } from '@tanstack/react-query';

import { api } from '@/lib/api';

interface UserStats {
  wins: number;
  participations: number;
  totalWinnings: number;
}

const fetchUserStats = async (): Promise<UserStats> => {
  const { data } = await api.get<UserStats>('/api/user/stats');
  return data;
};

export const userStatsQuery = queryOptions({
  queryKey: ['userStats'],
  queryFn: fetchUserStats,
  retry: false,
  staleTime: 1000 * 60 * 60,
});
