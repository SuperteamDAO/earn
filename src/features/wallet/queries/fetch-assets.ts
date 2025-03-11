import { queryOptions } from '@tanstack/react-query';

import { api } from '@/lib/api';

import { type TokenAsset } from '../types/TokenAsset';

const fetchTokenAssetsFn = async (): Promise<TokenAsset[]> => {
  const { data } = await api.get<TokenAsset[]>('/api/wallet/assets');
  return data;
};

export const tokenAssetsQuery = queryOptions({
  queryKey: ['wallet', 'assets'],
  queryFn: fetchTokenAssetsFn,
  staleTime: Infinity,
  gcTime: 1000 * 60 * 60 * 24,
  refetchOnWindowFocus: false,
  refetchOnMount: false,
});
