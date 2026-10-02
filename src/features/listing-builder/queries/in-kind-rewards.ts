import { queryOptions } from '@tanstack/react-query';

import { api } from '@/lib/api';

import { type InKindRewardMetadata } from '@/features/listings/types';

interface InKindRewardsResponse {
  rewards: InKindRewardMetadata[];
}

export const inKindRewardsQuery = (enabled = true) =>
  queryOptions({
    queryKey: ['in-kind-rewards'],
    queryFn: async () => {
      const response = await api.get<InKindRewardsResponse>(
        '/api/in-kind-rewards',
      );
      return response.data.rewards;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });
