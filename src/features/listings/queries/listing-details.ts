import { queryOptions } from '@tanstack/react-query';

import { api } from '@/lib/api';

import { type Listing } from '../types';

const fetchListingDetails = async (slug: string) => {
  const response = await api.get<Listing>(`/api/listings/details/${slug}`);
  return response.data;
};

export const listingDetailsQuery = (slug: string) =>
  queryOptions({
    queryKey: ['listing-details', slug],
    queryFn: () => fetchListingDetails(slug),
  });
