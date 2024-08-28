import { queryOptions } from '@tanstack/react-query';
import axios from 'axios';

interface TotalType {
  totalUsers?: number;
}

const fetchUserCount = async (): Promise<TotalType> => {
  const { data } = await axios.get('/api/homepage/user-count');
  return data;
};

export const userCountQuery = queryOptions({
  queryKey: ['user-count'],
  queryFn: fetchUserCount,
});
