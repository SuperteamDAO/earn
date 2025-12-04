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
    retry: (failureCount, error) => {
      // Don't retry on 403 errors (sponsor mismatch)
      const axiosError = error as { response?: { status?: number } };
      if (axiosError?.response?.status === 403) {
        return false;
      }
      // Retry other errors up to 3 times
      return failureCount < 3;
    },
  });
