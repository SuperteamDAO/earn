import { queryOptions } from '@tanstack/react-query';
import axios from 'axios';

import { ListingFormData } from '@/features/listing-builder';

const fetchListing = async (
  slug: string,
  isHackathon?: boolean,
): Promise<ListingFormData> => {
  const response = await axios.get(`/api/sponsor-dashboard/${slug}/listing/`, {
    params: { isHackathon },
  });
  return response.data;
};

export const sponsorDashboardListingQuery = (
  slug: string,
  isHackathon?: boolean,
) =>
  queryOptions({
    queryKey: ['sponsor-dashboard-listing', slug, isHackathon],
    queryFn: () => fetchListing(slug, isHackathon),
    enabled: !!slug,
  });
