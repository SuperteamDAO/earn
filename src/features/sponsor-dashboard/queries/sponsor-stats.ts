import { queryOptions } from '@tanstack/react-query';

import { api } from '@/lib/api';

import { type SponsorStats } from '@/features/sponsor-dashboard/types';

const fetchSponsorStats = async (): Promise<SponsorStats> => {
  const { data } = await api.get('/api/sponsors/stats');
  return data;
};

export const sponsorStatsQuery = (sponsorId: string | undefined) =>
  queryOptions({
    queryKey: ['sponsorStats', sponsorId],
    queryFn: fetchSponsorStats,
    enabled: !!sponsorId,
    staleTime: 1000 * 60 * 60,
  });
