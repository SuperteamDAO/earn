import { queryOptions } from '@tanstack/react-query';
import axios from 'axios';

import { type Listing } from '@/features/listings';

const fetchListing = async (slug: string): Promise<Listing> => {
  const response = await axios.get(`/api/sponsor-dashboard/${slug}/listing/`);
  return response.data;
};

export const sponsorDashboardListingQuery = (slug: string) =>
  queryOptions({
    queryKey: ['sponsor-dashboard-listing', slug],
    queryFn: () => fetchListing(slug),
    enabled: !!slug,
  });
