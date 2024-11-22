import { queryOptions } from '@tanstack/react-query';
import axios from 'axios';

import { type SponsorStats } from '@/features/sponsor-dashboard';

const fetchSponsorStats = async (): Promise<SponsorStats> => {
  const { data } = await axios.get('/api/sponsors/stats');
  return data;
};

export const sponsorStatsQuery = (sponsorId: string | undefined) =>
  queryOptions({
    queryKey: ['sponsorStats', sponsorId],
    queryFn: fetchSponsorStats,
    enabled: !!sponsorId,
    staleTime: 1000 * 60 * 60,
  });
