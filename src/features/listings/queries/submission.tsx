import { queryOptions } from '@tanstack/react-query';

import { type SubmissionWithUser } from '@/interface/submission';
import { api } from '@/lib/api';

import { type Listing } from '../types';

interface SubmissionDetailsParams {
  submissionId: string;
}

const fetchSubmissionDetails = async (
  params: SubmissionDetailsParams,
): Promise<{ submission: SubmissionWithUser; listing: Listing }> => {
  const { data } = await api.get(
    `/api/listings/submission-details/${params.submissionId}`,
  );
  return data;
};

export const submissionDetailsQuery = (params: SubmissionDetailsParams) =>
  queryOptions({
    queryKey: ['submission-details', params],
    queryFn: () => fetchSubmissionDetails(params),
  });
