import { queryOptions } from '@tanstack/react-query';
import axios from 'axios';

interface UserStats {
  wins: number;
  participations: number;
  totalWinnings: number;
}

const fetchUserStats = async (): Promise<UserStats> => {
  const { data } = await axios.get<UserStats>('/api/user/stats');
  return data;
};

export const userStatsQuery = queryOptions({
  queryKey: ['userStats'],
  queryFn: fetchUserStats,
  retry: false,
  staleTime: 1000 * 60 * 60,
});
