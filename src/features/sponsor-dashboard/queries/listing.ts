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
  });
