import { queryOptions } from '@tanstack/react-query';

import { api } from '@/lib/api';

import { type TokenAsset } from '../types/TokenAsset';

const fetchTokenAssetsFn = async (): Promise<TokenAsset[]> => {
  const { data } = await api.get<TokenAsset[]>('/api/wallet/assets');
  return data;
};

export const tokenAssetsQuery = queryOptions({
  queryKey: ['tokens', 'assets'],
  queryFn: fetchTokenAssetsFn,
  staleTime: 30000,
  refetchInterval: 60000,
});
