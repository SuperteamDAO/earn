import { type Regions } from '@prisma/client';
import { queryOptions } from '@tanstack/react-query';
import axios from 'axios';

import { type GrantWithApplicationCount } from '@/features/grants';

const fetchHomePageGrants = async (
  userRegion: Regions[] | null,
): Promise<GrantWithApplicationCount[]> => {
  const { data } = await axios.get('/api/homepage/grants/', {
    params: userRegion,
  });
  return data;
};

export const homepageGrantsQuery = (userRegion: Regions[] | null) =>
  queryOptions({
    queryKey: ['homepage-grants', userRegion],
    queryFn: () => fetchHomePageGrants(userRegion),
  });
