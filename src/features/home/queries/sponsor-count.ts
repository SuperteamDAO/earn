import { queryOptions } from '@tanstack/react-query';

import { api } from '@/lib/api';

interface TotalType {
  totalSponsors?: number;
}

const fetchSponsorCount = async (): Promise<TotalType> => {
  const { data } = await api.get('/api/homepage/sponsor-count');
  return data;
};

export const sponsorCountQuery = queryOptions({
  queryKey: ['sponsor-count'],
  queryFn: fetchSponsorCount,
  staleTime: 1000 * 60 * 60,
  gcTime: 1000 * 60 * 60 * 2,
});
