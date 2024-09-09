import { queryOptions } from '@tanstack/react-query';
import axios from 'axios';

interface ListingSubmissionParams {
  slug: string;
  isWinner?: boolean;
}

import { type SubmissionWithUser } from '@/interface/submission';

import { type Listing } from '../types';

const fetchListingSubmissions = async (
  params: ListingSubmissionParams,
): Promise<{
  bounty: Listing;
  submission: SubmissionWithUser[];
}> => {
  const slug = params.slug;
  delete (params as any).slug;
  const { data } = await axios.get(`/api/listings/submissions/${slug}/`, {
    params,
  });
  return data;
};

export const listingSubmissionsQuery = (params: ListingSubmissionParams) =>
  queryOptions({
    queryKey: ['listing-submissions', params],
    queryFn: () => fetchListingSubmissions(params),
  });
