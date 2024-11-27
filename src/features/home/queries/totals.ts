import { queryOptions } from '@tanstack/react-query';
import axios from 'axios';

interface TotalType {
  count?: number;
  totalInUSD?: number;
}

const fetchTotals = async (): Promise<TotalType> => {
  const { data } = await axios.get('/api/sidebar/stats');
  return data;
};

export const totalsQuery = queryOptions({
  queryKey: ['totals'],
  queryFn: fetchTotals,
  staleTime: 1000 * 60 * 60,
  gcTime: 1000 * 60 * 60 * 2,
});
