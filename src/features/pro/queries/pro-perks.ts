import { queryOptions } from '@tanstack/react-query';

import { api } from '@/lib/api';

interface ProPerk {
  id: string;
  header: string;
  description: string;
  cta: string;
  logo: string;
  ctaLink?: string;
}

const fetchProPerks = async (): Promise<ProPerk[]> => {
  const { data } = await api.get<{ perks: ProPerk[] }>('/api/pro/perks');
  return data.perks;
};

export const proPerksQuery = queryOptions({
  queryKey: ['proPerks'],
  queryFn: fetchProPerks,
  staleTime: 1000 * 60 * 5,
  gcTime: 1000 * 60 * 10,
});
