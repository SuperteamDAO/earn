import { queryOptions } from '@tanstack/react-query';

import { api } from '@/lib/api';
import { type GrantApplicationStatus } from '@/prisma/enums';
import { type GrantApplicationModel } from '@/prisma/models/GrantApplication';
import { type GrantTrancheModel } from '@/prisma/models/GrantTranche';

import { type Grant } from '@/features/grants/types';

export interface GrantTrancheWithApplication extends GrantTrancheModel {
  GrantApplication: GrantApplicationModel & {
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      photo: string | null;
      walletAddress: string;
      discord: string | null;
      username: string | null;
      twitter: string | null;
      telegram: string | null;
      website: string | null;
      Submission: {
        isWinner: boolean;
        rewardInUSD: number | null;
        listing: {
          isWinnersAnnounced: boolean;
        };
      }[];
      GrantApplication: {
        approvedAmountInUSD: number | null;
        applicationStatus: GrantApplicationStatus;
      }[];
    };
    grant: Grant;
  };
  totalEarnings: number;
  data: GrantTrancheWithApplication[];
  count: number;
}

export interface TranchesReturn {
  data: GrantTrancheWithApplication[];
  count: number;
}

const fetchTranches = async (slug: string) => {
  const { data } = await api.get<TranchesReturn>(
    `/api/sponsor-dashboard/grants/${slug}/tranches/`,
  );
  return data;
};

export const tranchesQuery = (slug: string) =>
  queryOptions({
    queryKey: ['sponsor-tranches', slug],
    queryFn: () => fetchTranches(slug),
  });
