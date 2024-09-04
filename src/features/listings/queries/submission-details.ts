import { queryOptions } from '@tanstack/react-query';
import axios from 'axios';

import { type SubmissionWithUser } from '@/interface/submission';

interface SubmissionDetailsParams {
  submissionId?: string;
}

const fetchSubmissionDetails = async (
  params: SubmissionDetailsParams,
): Promise<SubmissionWithUser> => {
  const { data } = await axios.get(`/api/submission/details/`, { params });
  return data;
};

export const submissionDetailsQuery = (params: SubmissionDetailsParams) =>
  queryOptions({
    queryKey: ['submissionDetails', params],
    queryFn: () => fetchSubmissionDetails(params),
    enabled: !!params.submissionId,
  });
