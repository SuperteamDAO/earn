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
type AnchorStep = BoostStep | 100;

interface AnchorItem {
  readonly step: AnchorStep;
  readonly usd: number;
  readonly isDynamic: boolean;
}

interface AnchorMap {
  readonly anchors: readonly AnchorItem[];
  readonly minStep: 0;
  readonly maxStep: AnchorStep;
  readonly defaultStep: AnchorStep;
}

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

const clampStepForAvailability = (
  step: number,
  isFeatureAvailable: boolean,
): BoostStep => {
  return (isFeatureAvailable ? step : step === 75 ? 50 : step) as BoostStep;
};

export const getAllowedMaxStep = (isFeatureAvailable: boolean): BoostStep => {
  return (isFeatureAvailable ? 75 : 50) as BoostStep;
};

const clampToAllowedStep = (
  step: number,
  isFeatureAvailable: boolean,
): BoostStep => {
  const max = getAllowedMaxStep(isFeatureAvailable);
  const bounded = Math.max(0, Math.min(step, max)) as BoostStep;
  return clampStepForAvailability(bounded, isFeatureAvailable);
};

const calculateTotalImpressions = (
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
    ? Math.round(estimate / 1000) * 1000
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
  const map = buildAnchorMap(estimatedUsdValue, isFeatureAvailable);
  const dyn = map.anchors.find((a) => a.step === (boostStep as AnchorStep));
  if (dyn) return dyn.usd;

  if (boostStep === 100) return map.anchors[map.anchors.length - 1]!.usd;

  const closest = map.anchors.reduce((best, a) => {
    const bestDiff = Math.abs(best.step - (boostStep as AnchorStep));
    const curDiff = Math.abs(a.step - (boostStep as AnchorStep));
    return curDiff < bestDiff ? a : best;
  }, map.anchors[0]!);
  return closest.usd;
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

export const getTotalImpressionsForUsd = (
  usdAmount: number | null,
  emailImpressions: number,
  isFeatureAvailable: boolean,
): number => {
  if (usdAmount === null || usdAmount < BOOST_STEP_TO_AMOUNT_USD[0]) return 0;

  let total = LIVE_LISTINGS_THREAD_IMPRESSIONS;

  if (usdAmount >= BOOST_STEP_TO_AMOUNT_USD[25]) {
    total += STANDALONE_POST_IMPRESSIONS;
  }

  if (usdAmount >= BOOST_STEP_TO_AMOUNT_USD[50]) {
    total += emailImpressions;
  }

  if (isFeatureAvailable && usdAmount >= BOOST_STEP_TO_AMOUNT_USD[75]) {
    total += FEATURED_HOMEPAGE_IMPRESSIONS;
  }

  return total;
};

const uniqSorted = (values: number[]): number[] => {
  return Array.from(new Set(values)).sort((a, b) => a - b);
};

export const buildAnchorMap = (
  priceUsd: number | null,
  isFeatureAvailable: boolean,
): AnchorMap => {
  const BASE_0 = BOOST_STEP_TO_AMOUNT_USD[0];
  const BASE_25 = BOOST_STEP_TO_AMOUNT_USD[25];
  const BASE_50 = BOOST_STEP_TO_AMOUNT_USD[50];
  const BASE_75 = BOOST_STEP_TO_AMOUNT_USD[75];
  const base: number[] = isFeatureAvailable
    ? [BASE_0, BASE_25, BASE_50, BASE_75]
    : [BASE_0, BASE_25, BASE_50];

  const MIN = BASE_0;
  const MAX = isFeatureAvailable ? BASE_75 : BASE_50;

  let amounts: number[] = [...base];

  if (typeof priceUsd === 'number' && Number.isFinite(priceUsd)) {
    const rounded = Math.round(priceUsd);
    if (rounded < MIN) {
      amounts = uniqSorted([...base, rounded]);
    } else if (rounded > MAX) {
      if (isFeatureAvailable) {
        amounts = uniqSorted([...base, rounded]);
      } else {
        amounts = uniqSorted([BASE_0, BASE_25, BASE_50, rounded]);
      }
    } else {
      amounts = uniqSorted([...base, rounded]);
    }
  }

  const needsRightExtra = isFeatureAvailable && amounts.length === 5;
  const steps: AnchorStep[] = needsRightExtra
    ? [0, 25, 50, 75, 100]
    : ([0, 25, 50, 75].slice(0, amounts.length) as AnchorStep[]);

  const anchors: AnchorItem[] = amounts.map((usd, idx) => ({
    step: steps[idx]!,
    usd,
    isDynamic: typeof priceUsd === 'number' && Math.round(priceUsd) === usd,
  }));

  let defaultStep: AnchorStep = 0;
  const match = anchors.find((a) => a.isDynamic);
  if (match) {
    defaultStep = match.step;
  } else {
    const estimated =
      typeof priceUsd === 'number' && Number.isFinite(priceUsd)
        ? Math.round(priceUsd)
        : 0;
    const fallback = amountToStep(estimated, isFeatureAvailable);
    const byStep = anchors.find((a) => a.step === (fallback as AnchorStep));
    defaultStep = byStep ? byStep.step : anchors[0]!.step;
  }

  const maxStep: AnchorStep = anchors[anchors.length - 1]!.step;

  return {
    anchors,
    minStep: 0,
    maxStep,
    defaultStep,
  } as const;
};
