import { queryOptions } from '@tanstack/react-query';

import { api } from '@/lib/api';
import { type HackathonModel } from '@/prisma/models/Hackathon';

const fetchActiveHackathons = async (): Promise<HackathonModel[]> => {
  const { data } = await api.get(`/api/sponsor-dashboard/active-hackathons/`);
  return data;
};

export const activeHackathonsQuery = () =>
  queryOptions({
    queryKey: ['active-hackathons'],
    queryFn: () => fetchActiveHackathons(),
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
