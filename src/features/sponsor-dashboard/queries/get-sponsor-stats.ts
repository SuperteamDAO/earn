import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

import { type SponsorStats } from '@/features/sponsor-dashboard';

const fetchSponsorStats = async (): Promise<SponsorStats> => {
  const { data } = await axios.get('/api/sponsors/stats');
  return data;
};

export const useSponsorsStats = () => {
  return useQuery({
    queryKey: ['sponsorStats'],
    queryFn: fetchSponsorStats,
  });
};
