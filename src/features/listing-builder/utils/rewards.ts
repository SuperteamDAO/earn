import { BONUS_REWARD_POSITION } from '@/constants';
import { type Rewards } from '@/features/listings';
import { cleanRewards } from '@/utils/rank';

import { type ListingFormData } from '../types';

export const calculateTotalPrizes = (
  rewards: Rewards | undefined | null,
  maxBonusSpots: number,
) => cleanRewards(rewards, true).length + (maxBonusSpots ?? 0);

export const calculateTotalRewardsForPodium = (
  currentRewards: Record<string, number>,
  maxBonusSpots: number,
) => {
  return Object.entries(currentRewards).reduce((sum, [pos, value]) => {
    if (isNaN(value)) return sum;

    if (Number(pos) === BONUS_REWARD_POSITION) {
      console.log('bonus reward', value, maxBonusSpots);
      return sum + value * (maxBonusSpots || 0);
    }
    return sum + value;
  }, 0);
};

export const refineReadyListing = (listing: ListingFormData) => {
  if (listing.type !== 'project') {
    listing.compensationType = 'fixed';
    listing.maxRewardAsk = null;
    listing.minRewardAsk = null;
  } else {
    if (listing.compensationType !== 'fixed') {
      listing.rewards = undefined;
      listing.rewardAmount = undefined;
    } else {
      listing.rewards = { 1: listing.rewardAmount || 0 };
    }
    if (listing.compensationType !== 'range') {
      listing.minRewardAsk = undefined;
      listing.maxRewardAsk = undefined;
    }
  }
  return listing;
};
