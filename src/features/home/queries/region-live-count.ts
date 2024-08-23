import { queryOptions } from '@tanstack/react-query';
import axios from 'axios';

const fetchRegionLiveCount = async (region: string) => {
  const { data } = await axios.get<{ count: number }>(
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
