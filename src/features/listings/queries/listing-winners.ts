import { queryOptions } from '@tanstack/react-query';
import axios from 'axios';

import { type SubmissionWithUser } from '@/interface/submission';

const fetchWinners = async (id: string): Promise<SubmissionWithUser[]> => {
  const { data } = await axios.get(`/api/listings/${id}/winners/`);
  return data.sort((a: SubmissionWithUser, b: SubmissionWithUser) => {
    if (!a.winnerPosition) return 1;
    if (!b.winnerPosition) return -1;
    return Number(a.winnerPosition) - Number(b.winnerPosition);
  });
};

export const listingWinnersQuery = (bountyId: string | undefined) =>
  queryOptions({
    queryKey: ['winners', bountyId],
    queryFn: () => fetchWinners(bountyId!),
    enabled: !!bountyId,
  });
