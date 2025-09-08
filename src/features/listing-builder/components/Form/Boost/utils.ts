import { calculateTotalRewardsForPodium } from '@/features/listing-builder/utils/rewards';

import {
  BOOST_STEP_TO_AMOUNT_USD,
  BOOST_STEPS,
  type BoostStep as BoostStepFromConstants,
  FEATURED_HOMEPAGE_IMPRESSIONS,
  LIVE_LISTINGS_THREAD_IMPRESSIONS,
  STANDALONE_POST_IMPRESSIONS,
} from './constants';

export type BoostStep = BoostStepFromConstants;

export const amountToStep = (
  usdAmount: number,
  isFeatureAvailable: boolean,
): BoostStep => {
  const allowedSteps = (
    isFeatureAvailable
      ? BOOST_STEPS
      : (BOOST_STEPS.filter((s) => s !== 75) as readonly BoostStep[])
  ) as readonly BoostStep[];

  let result: BoostStep = 0;
  for (const step of allowedSteps) {
    if (usdAmount >= BOOST_STEP_TO_AMOUNT_USD[step]) {
      result = step;
    }
  }
  return result;
};

export const getDollarAmountForStep = (step: number): number => {
  const key = step as BoostStep;
  return BOOST_STEP_TO_AMOUNT_USD[key] ?? BOOST_STEP_TO_AMOUNT_USD[0];
};

export const clampStepForAvailability = (
  step: number,
  isFeatureAvailable: boolean,
): BoostStep => {
  return (isFeatureAvailable ? step : step === 75 ? 50 : step) as BoostStep;
};

export const calculateTotalImpressions = (
  step: BoostStep,
  emailImpressions: number,
  isFeatureAvailable: boolean,
): number => {
  let total = LIVE_LISTINGS_THREAD_IMPRESSIONS;

  if (step >= 25) {
    total += STANDALONE_POST_IMPRESSIONS;
  }

  if (step >= 50) {
    total += emailImpressions;
  }

  if (isFeatureAvailable && step >= 75) {
    total += FEATURED_HOMEPAGE_IMPRESSIONS;
  }

  return total;
};

export const computeScaledRewardsForTargetUSD = (
  currentRewards: Record<string, number> | undefined,
  maxBonusSpots: number | undefined,
  tokenUsdValue: number | null,
  targetUSD: number,
): {
  readonly scaledRewards: Readonly<Record<string, number>> | undefined;
  readonly newTotalTokens: number;
} => {
  const newTotalTokens = tokenUsdValue ? targetUSD / tokenUsdValue : targetUSD;

  if (!currentRewards || Object.keys(currentRewards).length === 0) {
    return { scaledRewards: undefined, newTotalTokens };
  }

  const oldTotal = calculateTotalRewardsForPodium(
    currentRewards as Record<string, number>,
    (maxBonusSpots as number) || 0,
  );

  if (oldTotal <= 0) {
    return { scaledRewards: undefined, newTotalTokens };
  }

  const ratio = newTotalTokens / oldTotal;
  const scaledRewards = Object.entries(currentRewards).reduce(
    (acc, [position, value]) => {
      const numeric = Number(value);
      if (Number.isNaN(numeric)) return { ...acc, [position]: value };
      return { ...acc, [position]: numeric * ratio };
    },
    {} as Record<string, number>,
  );

  return { scaledRewards, newTotalTokens };
};

export const hasMoreThan72HoursLeft = (deadline: string | Date): boolean => {
  const now = Date.now();
  const deadlineMs = new Date(deadline).getTime();
  const seventyTwoHoursMs = 72 * 60 * 60 * 1000;
  return deadlineMs - now > seventyTwoHoursMs;
};
