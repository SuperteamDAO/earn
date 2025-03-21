import { queryOptions } from '@tanstack/react-query';

import { api } from '@/lib/api';

import { type Grant } from '@/features/grants/types';

interface GrantWithApplicationCount extends Grant {
  totalApplications: number;
  grantTrancheCount: number;
}

export const sponsorGrantQuery = (
  slug: string,
  currentSponsorId: string | undefined,
) =>
  queryOptions({
    queryKey: ['grant', slug],
    queryFn: async (): Promise<GrantWithApplicationCount> => {
      const response = await api.get(`/api/sponsor-dashboard/grants/${slug}/`);
      return response.data;
    },
    enabled: !!currentSponsorId,
  });
