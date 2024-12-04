import { queryOptions } from '@tanstack/react-query';
import axios from 'axios';

const fetchLiveOpportunities = async () => {
  const response = await axios.get<{ totalUsdValue: number }>(
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
