import { cleanRewards } from '@/utils/rank';

import { type Rewards } from '@/features/listings/types';

import { BONUS_REWARD_POSITION } from '../constants';

export const calculateTotalPrizes = (
  rewards: Rewards | undefined | null,
  maxBonusSpots: number,
) =>
  cleanRewards(rewards, true).length +
  ((rewards?.[BONUS_REWARD_POSITION] || 0) > 0 ? (maxBonusSpots ?? 0) : 0);

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

interface ScaleRewardsParams {
  readonly rewards: unknown;
  readonly maxBonusSpots: unknown;
  readonly targetUsd: number;
  readonly tokenUsdValue: number;
  readonly shouldScalePodium: boolean;
  readonly shouldRoundToNearestTen: boolean;
}

interface ScaleRewardsResult {
  readonly rewardAmountTokens: number;
  readonly rewardsToPersist: Record<string, number> | null;
}

const coerceRewardsRecord = (
  rewards: unknown,
): Record<string, number> | null => {
  if (!rewards || typeof rewards !== 'object') return null;
  const entries = Object.entries(rewards as Record<string, unknown>);
  if (entries.length === 0) return null;
  return entries.reduce<Record<string, number>>((acc, [key, value]) => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      acc[key] = value;
      return acc;
    }
    const numeric = Number(value);
    acc[key] = Number.isFinite(numeric) ? numeric : (value as number);
    return acc;
  }, {});
};

const toNumber = (value: unknown): number => {
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

export const scaleRewardsForTargetUsd = (
  params: ScaleRewardsParams,
): ScaleRewardsResult => {
  const tokenUsdValue = toNumber(params.tokenUsdValue);
  const targetUsd = Math.max(0, params.targetUsd);
  const targetTokens =
    tokenUsdValue > 0 ? targetUsd / tokenUsdValue : targetUsd;

  if (!params.shouldScalePodium) {
    return { rewardAmountTokens: targetTokens, rewardsToPersist: null };
  }

  const rewardsRecord = coerceRewardsRecord(params.rewards);
  if (!rewardsRecord) {
    return { rewardAmountTokens: targetTokens, rewardsToPersist: null };
  }

  const maxBonusSpots = Math.max(0, Math.floor(toNumber(params.maxBonusSpots)));
  const currentTotalTokens = calculateTotalRewardsForPodium(
    rewardsRecord,
    maxBonusSpots,
  );

  if (currentTotalTokens <= 0) {
    return { rewardAmountTokens: targetTokens, rewardsToPersist: null };
  }

  const ratio = targetTokens / currentTotalTokens;
  const scaled = Object.entries(rewardsRecord).reduce<Record<string, number>>(
    (acc, [key, value]) => {
      const numeric = Number(value);
      acc[key] = Number.isFinite(numeric) ? numeric * ratio : (value as number);
      return acc;
    },
    {},
  );

  if (!params.shouldRoundToNearestTen) {
    return {
      rewardAmountTokens: targetTokens,
      rewardsToPersist: scaled,
    };
  }

  const rounded = Object.entries(scaled).reduce<Record<string, number>>(
    (acc, [key, value]) => {
      const numeric = Number(value) || 0;
      const nearestTen = Math.round(numeric / 10) * 10;
      acc[key] = nearestTen;
      return acc;
    },
    {},
  );
  const roundedSum = calculateTotalRewardsForPodium(rounded, maxBonusSpots);

  return {
    rewardAmountTokens: roundedSum,
    rewardsToPersist: rounded,
  };
};
