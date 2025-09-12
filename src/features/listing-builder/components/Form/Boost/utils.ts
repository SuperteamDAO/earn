import {
  BOOST_STEP_TO_AMOUNT_USD,
  BOOST_STEPS,
  type BoostStep as BoostStepFromConstants,
  DEFAULT_EMAIL_IMPRESSIONS,
  FEATURED_HOMEPAGE_IMPRESSIONS,
  isSkillsSelected,
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

export const getAllowedMaxStep = (isFeatureAvailable: boolean): BoostStep => {
  return (isFeatureAvailable ? 75 : 50) as BoostStep;
};

export const getAllowedTopUsd = (isFeatureAvailable: boolean): number => {
  const topStep = getAllowedMaxStep(isFeatureAvailable);
  return BOOST_STEP_TO_AMOUNT_USD[topStep];
};

export const clampToAllowedStep = (
  step: number,
  isFeatureAvailable: boolean,
): BoostStep => {
  const max = getAllowedMaxStep(isFeatureAvailable);
  const bounded = Math.max(0, Math.min(step, max)) as BoostStep;
  return clampStepForAvailability(bounded, isFeatureAvailable);
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

export const hasMoreThan72HoursLeft = (deadline: string | Date): boolean => {
  const now = Date.now();
  const deadlineMs = new Date(deadline).getTime();
  const seventyTwoHoursMs = 72 * 60 * 60 * 1000;
  return deadlineMs - now > seventyTwoHoursMs;
};

export const resolveEmailImpressions = (
  skills: unknown,
  estimate: unknown,
): number => {
  return isSkillsSelected(skills) && typeof estimate === 'number'
    ? estimate
    : DEFAULT_EMAIL_IMPRESSIONS;
};

export const computeEstimatedUsdValue = (
  rewardAmount: unknown,
  tokenUsdValue: unknown,
): number | null => {
  const amount = typeof rewardAmount === 'number' ? rewardAmount : 0;
  const usd =
    typeof tokenUsdValue === 'number' && Number.isFinite(tokenUsdValue)
      ? tokenUsdValue
      : null;
  return usd !== null ? amount * usd : null;
};

export const resolveTargetUsdFromBoost = (
  boostStep: number,
  estimatedUsdValue: number | null,
  isFeatureAvailable: boolean,
): number => {
  const allowedTopStep = getAllowedMaxStep(isFeatureAvailable);
  const allowedTopUsd = BOOST_STEP_TO_AMOUNT_USD[allowedTopStep];

  if (
    boostStep < 0 &&
    estimatedUsdValue !== null &&
    estimatedUsdValue < allowedTopUsd
  ) {
    return Math.round(estimatedUsdValue);
  }

  if (
    boostStep > allowedTopStep &&
    estimatedUsdValue !== null &&
    estimatedUsdValue > allowedTopUsd
  ) {
    return Math.round(estimatedUsdValue);
  }

  const clamped = Math.max(0, Math.min(boostStep, allowedTopStep));
  return getDollarAmountForStep(clamped);
};

export const getTotalImpressionsForValue = (
  value: number,
  emailImpressions: number,
  isFeatureAvailable: boolean,
): number => {
  if (value < 0) return 0;
  const clamped = clampToAllowedStep(value, isFeatureAvailable);
  return calculateTotalImpressions(
    clamped,
    emailImpressions,
    isFeatureAvailable,
  );
};
