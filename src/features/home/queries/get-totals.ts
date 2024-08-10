import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface TotalType {
  count?: number;
  totalInUSD?: number;
  totalUsers?: number;
}

const fetchTotals = async (): Promise<TotalType> => {
  const { data } = await axios.get('/api/sidebar/totals');
  return data;
};

export const useGetTotals = () => {
  return useQuery({
    queryKey: ['totals'],
    queryFn: fetchTotals,
  });
};
