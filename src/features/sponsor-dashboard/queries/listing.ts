import { type Submission } from '@prisma/client';
import { queryOptions } from '@tanstack/react-query';
import axios from 'axios';

import { type Listing } from '@/features/listings';
import { dayjs } from '@/utils/dayjs';
import { cleanRewards, sortRank } from '@/utils/rank';

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
    select: (data) => {
      const isExpired = data.deadline && dayjs(data.deadline).isBefore(dayjs());
      const usedPositions = data.Submission.filter((s: any) => s.isWinner)
        .map((s: any) => Number(s.winnerPosition))
        .filter((key: number) => !isNaN(key));
      const prizes = sortRank(cleanRewards(data.rewards));

      return {
        ...data,
        isExpired,
        usedPositions,
        prizes,
        totalWinners: data.winnersSelected,
        totalPaymentsMade: data.paymentsMade,
      };
    },
  });
