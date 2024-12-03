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
  staleTime: 1000 * 60 * 60,
  gcTime: 1000 * 60 * 60 * 2,
});
