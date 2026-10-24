import {
  type InKindRewardMetadata,
  type ListingReward,
  type Rewards,
} from '../types';

interface ListingRewardFields {
  rewardType?: 'TOKEN' | 'IN_KIND';
  token?: string | null;
  inKindReward?: InKindRewardMetadata | null;
  rewardAmount?: number | null;
  rewards?: Rewards | null;
}

export function getListingReward(
  listing: ListingRewardFields,
): ListingReward | null {
  const total = listing.rewardAmount;
  if (total == null) return null;

  const distribution = listing.rewards ?? undefined;

  if (listing.rewardType === 'IN_KIND') {
    if (!listing.inKindReward) return null;

    return {
      type: 'IN_KIND',
      item: listing.inKindReward,
      total,
      distribution,
    };
  }

  if (!listing.token) return null;

  return {
    type: 'TOKEN',
    token: listing.token,
    total,
    distribution,
  };
}
