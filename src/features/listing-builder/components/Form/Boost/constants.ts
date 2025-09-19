export const BOOST_STEPS = [0, 25, 50, 75] as const;
export type BoostStep = (typeof BOOST_STEPS)[number];

export const BOOST_STEP_TO_AMOUNT_USD: Readonly<Record<BoostStep, number>> = {
  0: 500,
  25: 1500,
  50: 2000,
  75: 5000,
} as const;

export const LIVE_LISTINGS_THREAD_IMPRESSIONS = 2000;
export const STANDALONE_POST_IMPRESSIONS = 5000;
export const FEATURED_HOMEPAGE_IMPRESSIONS = 50000;
export const DEFAULT_EMAIL_IMPRESSIONS = 30000;

export const isSkillsSelected = (skills: unknown): boolean =>
  Array.isArray(skills) && skills.length > 0;
