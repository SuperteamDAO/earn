import { queryOptions } from '@tanstack/react-query';

import { loadTokenList } from '@/constants/tokenList';

import { fetchTokenUSDValue } from '@/features/wallet/utils/fetchTokenUSDValue';

export const tokenUsdValueQuery = (tokenSymbol?: string | null) => {
  return queryOptions({
    queryKey: ['tokenUsdValue', tokenSymbol],
    queryFn: async (): Promise<number> => {
      if (!tokenSymbol) throw new Error('No token symbol');
      const tokens = await loadTokenList();
      const mintAddress = tokens.find(
        (token) => token.tokenSymbol === tokenSymbol,
      )?.mintAddress;
      if (!mintAddress) throw new Error('No mint address');
      return await fetchTokenUSDValue(mintAddress);
    },
    enabled: Boolean(tokenSymbol),
    staleTime: 1000 * 60 * 5,
  });
};
