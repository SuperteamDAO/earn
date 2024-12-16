import { type Rewards } from '@/features/listings';
import { cleanRewards } from '@/utils/rank';

import { BONUS_REWARD_POSITION } from '../constants';

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
      return sum + value * (maxBonusSpots || 0);
    }
    return sum + value;
  }, 0);
};
