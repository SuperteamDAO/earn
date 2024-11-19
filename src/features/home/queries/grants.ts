import { queryOptions } from '@tanstack/react-query';
import axios from 'axios';

import { type GrantWithApplicationCount } from '@/features/grants';

interface GrantsParams {
  userRegion: string[] | null;
}

const fetchHomePageGrants = async (
  params: GrantsParams,
): Promise<GrantWithApplicationCount[]> => {
  const { data } = await axios.get('/api/homepage/grants/', {
    params,
  });
  return data;
};

export const homepageGrantsQuery = (params: GrantsParams) =>
  queryOptions({
    queryKey: ['homepage-grants', params],
    queryFn: () => fetchHomePageGrants(params),
  });
