import { queryOptions } from '@tanstack/react-query';

import { api } from '@/lib/api';

import { type Listing } from '@/features/listings/types';

const fetchListing = async (slug: string): Promise<Listing> => {
  const response = await api.get(`/api/sponsor-dashboard/${slug}/listing/`);
  return response.data;
};

export const sponsorDashboardListingQuery = (slug: string) =>
  queryOptions({
    queryKey: ['sponsor-dashboard-listing', slug],
    queryFn: () => fetchListing(slug),
    enabled: !!slug,
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
