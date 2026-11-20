import { queryOptions } from '@tanstack/react-query';

import { api } from '@/lib/api';
// What /api/sponsor-dashboard/active-hackathons selects; dates arrive as strings.
export interface ActiveHackathon {
  id: string;
  name: string;
  slug: string;
  altLogo: string | null;
  logo: string;
  startDate: string | null;
  deadline: string | null;
  eligibility: unknown;
}

const fetchActiveHackathons = async (): Promise<ActiveHackathon[]> => {
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
