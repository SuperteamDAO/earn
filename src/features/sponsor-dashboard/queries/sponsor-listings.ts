import { queryOptions } from '@tanstack/react-query';

import { api } from '@/lib/api';

import { type Listing } from '@/features/listings/types';

interface Listings {
  bounties: Listing[];
}

const fetchListings = async (slug: string): Promise<Listings> => {
  const { data } = await api.post(`/api/listings/sponsor`, {
    sponsor: slug,
  });
  return data;
};

export const sponsorListingsQuery = (slug: string) =>
  queryOptions({
    queryKey: ['sponsorListings', slug],
    queryFn: () => fetchListings(slug),
    enabled: !!slug,
  });
