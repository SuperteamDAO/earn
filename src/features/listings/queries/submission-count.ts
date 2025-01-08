import { queryOptions } from '@tanstack/react-query';

import { api } from '@/lib/api';

const fetchSubmissionCount = async (listingId: string): Promise<number> => {
  const { data } = await api.get(
    `/api/listings/${listingId}/submission-count/`,
  );
  return data;
};

export const submissionCountQuery = (listingId: string) =>
  queryOptions({
    queryKey: ['submissionCount', listingId],
    queryFn: () => fetchSubmissionCount(listingId),
    enabled: !!listingId,
  });
