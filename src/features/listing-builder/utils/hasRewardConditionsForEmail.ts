import { type Bounties } from '@prisma/client';

export const hasRewardConditionsForEmail = (result: Bounties) =>
  (result.compensationType === 'fixed' &&
    result.rewardAmount &&
    result.rewardAmount >= 1000) ||
  result.compensationType === 'variable' ||
  (result.compensationType === 'range' &&
    result.maxRewardAsk &&
    result.maxRewardAsk >= 1000);
