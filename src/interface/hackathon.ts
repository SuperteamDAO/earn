import { type ListingRewardType } from '@/prisma/enums';

import { type InKindRewardMetadata } from '@/features/listings/types';

export interface TrackProps {
  title: string;
  slug: string;
  sponsor: {
    name: string;
    logo: string;
    chapter?: {
      id: string;
    } | null;
  };
  rewardType?: ListingRewardType;
  token: string | null;
  inKindReward?: InKindRewardMetadata | null;
  rewardAmount: number;
}
