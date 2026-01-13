import { queryOptions } from '@tanstack/react-query';

import { tokenList } from '@/constants/tokenList';
import { api } from '@/lib/api';

import { fetchTokenUSDValue } from '@/features/wallet/utils/fetchTokenUSDValue';

import { isSkillsSelected } from './constants';

export const tokenUsdValueQuery = (tokenSymbol?: string | null) => {
  const tokenData = tokenSymbol
    ? tokenList.find((t) => t.tokenSymbol === tokenSymbol)
    : undefined;
  const mintAddress = tokenData?.mintAddress;

  return queryOptions({
    queryKey: ['boost.tokenUsdValue', mintAddress],
    queryFn: async (): Promise<number> => {
      if (!mintAddress) throw new Error('No mint address');
      return await fetchTokenUSDValue(mintAddress);
    },
    enabled: Boolean(mintAddress),
    staleTime: 1000 * 60 * 5,
  });
};

export const featuredAvailabilityQuery = () =>
  queryOptions({
    queryKey: ['boost.featuredAvailability'],
    queryFn: async (): Promise<{
      readonly isAvailable: boolean;
      readonly count?: number;
    }> => {
      const { data } = await api.post<{ count?: number }>(
        '/api/sponsor-dashboard/listing/featured-posts',
      );
      const isAvailable =
        typeof data.count === 'number' ? data.count < 2 : true;
      return { isAvailable, count: data.count };
    },
    staleTime: 1000 * 60,
  });

export const emailEstimateQuery = (skills: unknown, region?: string | null) => {
  const enabled = isSkillsSelected(skills);
  return queryOptions({
    queryKey: ['boost.emailEstimate', { skills, region }],
    queryFn: async (): Promise<number> => {
      const { data } = await api.post<{ count?: number }>(
        '/api/sponsor-dashboard/listing/email-estimate',
        { skills, region },
      );
      return typeof data.count === 'number' ? data.count : 0;
    },
    enabled,
    staleTime: 1000 * 60 * 10,
  });
};
