import { queryOptions } from '@tanstack/react-query';

import { api } from '@/lib/api';

import { type Listing, type ListingHackathon } from '@/features/listings/types';

// /api/sponsor-dashboard/[slug]/listing selects a different Hackathon subset
// than the public listing APIs: it adds id and eligibility, and omits logo and
// Sponsor.
export type SponsorDashboardListing = Omit<Listing, 'Hackathon'> & {
  Hackathon?: Pick<
    ListingHackathon,
    | 'altLogo'
    | 'startDate'
    | 'name'
    | 'description'
    | 'slug'
    | 'announceDate'
    | 'deadline'
  > & { id: string; eligibility: unknown };
};

const fetchListing = async (slug: string): Promise<SponsorDashboardListing> => {
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
