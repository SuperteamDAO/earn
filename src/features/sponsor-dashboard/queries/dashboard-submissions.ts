import { queryOptions } from '@tanstack/react-query';

import { type SubmissionWithUser } from '@/interface/submission';
import { api } from '@/lib/api';

import { type Listing } from '@/features/listings/types';

export type SubmissionWithListingUser = SubmissionWithUser & {
  listing: Listing;
};

const fetchSubmissions = async (): Promise<SubmissionWithListingUser[]> => {
  const { data } = await api.get('/api/sponsor-dashboard/submissions');
  return data;
};

export const sponsorshipSubmissionsQuery = (sponsorId: string | undefined) =>
  queryOptions({
    queryKey: ['submissions-dashboard', sponsorId],
    queryFn: () => fetchSubmissions(),
    retry: false,
  });
