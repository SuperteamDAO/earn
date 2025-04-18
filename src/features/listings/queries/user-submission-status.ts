import { queryOptions } from '@tanstack/react-query';

import { api } from '@/lib/api';

const checkUserSubmission = async (listingId: string) => {
  const { data } = await api.get('/api/submission/check/', {
    params: { listingId },
  });
  return data;
};

export const userSubmissionQuery = (
  listingId: string,
  userId: string | undefined,
) =>
  queryOptions({
    queryKey: ['userSubmission', listingId],
    queryFn: () => checkUserSubmission(listingId),
    enabled: !!userId,
  });
