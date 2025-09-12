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

  const floatScaled: Record<string, number> = Object.entries(
    currentRewards,
  ).reduce(
    (acc, [position, value]) => {
      const numeric = Number(value);
      if (Number.isNaN(numeric))
        return { ...acc, [position]: value } as Record<string, number>;
      return { ...acc, [position]: numeric * ratio } as Record<string, number>;
    },
    {} as Record<string, number>,
  );

  if (tokenUsdValue !== null && tokenUsdValue <= 10) {
    const numericEntries = Object.entries(floatScaled).filter(
      ([, v]) => typeof v === 'number' && Number.isFinite(v),
    ) as Array<[string, number]>;

    const floors = numericEntries.map(([key, v]) => ({
      key,
      floor: Math.floor(v),
      frac: v - Math.floor(v),
    }));
    const sumFloors = floors.reduce((sum, item) => sum + item.floor, 0);
    const targetTotal = Math.ceil(newTotalTokens);
    let remaining = targetTotal - sumFloors;

    if (remaining > 0) {
      const byFracDesc = [...floors].sort((a, b) => b.frac - a.frac);
      let i = 0;
      while (remaining > 0 && byFracDesc.length > 0) {
        const idx = i % byFracDesc.length;
        const elem = byFracDesc[idx];
        if (!elem) break;
        elem.floor += 1;
        remaining -= 1;
        i += 1;
      }
    } else if (remaining < 0) {
      const byFracAsc = [...floors].sort((a, b) => a.frac - b.frac);
      let i = 0;
      while (remaining < 0 && byFracAsc.length > 0) {
        const idx = i % byFracAsc.length;
        const elem = byFracAsc[idx];
        if (!elem) break;
        elem.floor = Math.max(0, elem.floor - 1);
        remaining += 1;
        i += 1;
      }
    }

    const rounded: Record<string, number> = { ...floatScaled };
    for (const { key, floor } of floors) {
      rounded[key] = floor;
    }

    const adjustedTotal = floors.reduce((sum, i) => sum + i.floor, 0);
    return { scaledRewards: rounded, newTotalTokens: adjustedTotal };
  }

  return { scaledRewards: floatScaled, newTotalTokens };
};

export const hasMoreThan72HoursLeft = (deadline: string | Date): boolean => {
  const now = Date.now();
  const deadlineMs = new Date(deadline).getTime();
  const seventyTwoHoursMs = 72 * 60 * 60 * 1000;
  return deadlineMs - now > seventyTwoHoursMs;
};
