import { queryOptions } from '@tanstack/react-query';

import { api } from '@/lib/api';

const fetchLiveOpportunities = async () => {
  const response = await api.get<{ totalUsdValue: number }>(
    '/api/listings/live-opportunities',
  );
  return response.data;
};

export const liveOpportunitiesQuery = queryOptions({
  queryKey: ['liveOpportunities'],
  queryFn: fetchLiveOpportunities,
  // 1 day
  staleTime: 24 * 60 * 60 * 1000,
  gcTime: 24 * 60 * 60 * 1000,
});
