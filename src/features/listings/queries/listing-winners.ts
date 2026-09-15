import { queryOptions } from '@tanstack/react-query';

import { type ListingWinner } from '@/interface/submission';
import { api } from '@/lib/api';

const fetchWinners = async (id: string): Promise<ListingWinner[]> => {
  const { data } = await api.get<ListingWinner[]>(
    `/api/listings/${id}/winners/`,
  );
  return data.sort((a, b) => {
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
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
