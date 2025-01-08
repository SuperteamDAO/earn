import { queryOptions } from '@tanstack/react-query';

import { api } from '@/lib/api';

import { type GrantWithApplicationCount } from '@/features/grants/types';

const fetchGrants = async (
  slug: string,
): Promise<GrantWithApplicationCount[]> => {
  const { data } = await api.post('/api/grants/sponsor', { sponsor: slug });
  return data;
};

export const sponsorGrantsQuery = (slug: string) =>
  queryOptions({
    queryKey: ['sponsorGrants', slug],
    queryFn: () => fetchGrants(slug),
    enabled: !!slug,
  });
