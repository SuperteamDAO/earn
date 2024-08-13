import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

import { type GrantWithApplicationCount } from '@/features/grants';

interface GetGrantsParams {
  order?: 'asc' | 'desc';
}

const fetchGrants = async (
  params: GetGrantsParams = {},
): Promise<GrantWithApplicationCount[]> => {
  const { data } = await axios.get('/api/grants/', { params });
  return data;
};

export const useGetGrants = (params: GetGrantsParams = {}) => {
  return useQuery({
    queryKey: ['grants', params],
    queryFn: () => fetchGrants(params),
  });
};
