import { type Submission } from '@prisma/client';
import { queryOptions } from '@tanstack/react-query';
import axios from 'axios';

import { type Listing } from '@/features/listings';

interface SDListing extends Listing {
  Submission: Submission[];
  winnersSelected: number;
  paymentsMade: number;
}

const fetchListing = async (slug: string): Promise<SDListing> => {
  const { data } = await axios.get(`/api/sponsor-dashboard/${slug}/listing/`);
  return data;
};

export const listingQuery = (slug: string, userId: string | undefined) =>
  queryOptions({
    queryKey: ['bounty', slug],
    queryFn: () => fetchListing(slug),
    enabled: !!userId,
  });
