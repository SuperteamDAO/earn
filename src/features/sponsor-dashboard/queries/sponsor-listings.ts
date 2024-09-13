import { queryOptions } from '@tanstack/react-query';
import axios from 'axios';

import { type Listing } from '@/features/listings';

interface Listings {
  bounties: Listing[];
}

const fetchListings = async (slug: string): Promise<Listings> => {
  const { data } = await axios.post(`/api/listings/sponsor`, {
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
