import { queryOptions } from '@tanstack/react-query';
import axios from 'axios';

import { type GrantWithApplicationCount } from '@/features/grants';

const fetchGrants = async (
  slug: string,
): Promise<GrantWithApplicationCount[]> => {
  const { data } = await axios.post('/api/grants/sponsor', { sponsor: slug });
  return data;
};

export const sponsorGrantsQuery = (slug: string) =>
  queryOptions({
    queryKey: ['sponsorGrants', slug],
    queryFn: () => fetchGrants(slug),
    enabled: !!slug,
  });
