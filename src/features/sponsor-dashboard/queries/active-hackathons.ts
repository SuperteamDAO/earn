import { queryOptions } from '@tanstack/react-query';

import { type HackathonModel } from '@/interface/prisma/models';
import { api } from '@/lib/api';

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
