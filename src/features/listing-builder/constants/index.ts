export const MAX_PODIUMS = 10;
export const MAX_BONUS_SPOTS = 500;
export const BONUS_REWARD_POSITION = 99;
export const MAX_REWARD = 100_000_000_000_000; // 100 Trillion

export const AUTO_GENERATE_STORAGE_KEY = `ai-generate-form-listing-builder`;

export const DEADLINE_FORMAT = 'YYYY-MM-DDTHH:mm:ss.SSS[Z]';

export function getDefaultListingToken(isST: boolean, hackathonSlug?: string) {
  return isST || hackathonSlug === 'crypto-worlds-fair' ? 'USDG' : 'USDC';
}
