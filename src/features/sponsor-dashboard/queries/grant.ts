import { queryOptions } from '@tanstack/react-query';

import { api } from '@/lib/api';

import { type SponsorGrantDetailsResponse } from '../constants/sponsorGrantDetails';

export const sponsorGrantQuery = (
  slug: string,
  currentSponsorId: string | undefined,
) =>
  queryOptions({
    queryKey: ['grant', slug],
    queryFn: async (): Promise<SponsorGrantDetailsResponse> => {
      const response = await api.get<SponsorGrantDetailsResponse>(
        `/api/sponsor-dashboard/grants/${slug}/`,
      );
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
