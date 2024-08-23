import { queryOptions } from '@tanstack/react-query';
import axios from 'axios';

const fetchSubmissionCount = async (listingId: string): Promise<number> => {
  const { data } = await axios.get(
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
