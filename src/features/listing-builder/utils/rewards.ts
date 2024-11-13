import { type Rewards } from '@/features/listings';
import { cleanRewards } from '@/utils/rank';

export const calculateTotalPrizes = (
  rewards: Rewards | undefined,
  maxBonusSpots: number,
) => cleanRewards(rewards, true).length + (maxBonusSpots ?? 0);
