import { queryOptions } from '@tanstack/react-query';

import { api } from '@/lib/api';

const fetchRegionLiveCount = async (region: string) => {
  const { data } = await api.get<{ count: number }>(
    '/api/listings/region-live-count',
    { params: { region: region.toLowerCase() } },
  );
  return data;
};

export const regionLiveCountQuery = (region: string) =>
  queryOptions({
    queryKey: ['regionLiveCount', region],
    queryFn: () => fetchRegionLiveCount(region),
    enabled: false,
  });
