import { useQuery } from '@tanstack/react-query';
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

export const useGetUserStats = () => {
  return useQuery({
    queryKey: ['userStats'],
    queryFn: fetchUserStats,
  });
};
