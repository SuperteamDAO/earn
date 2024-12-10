export interface MultiSelectOptions {
  value: string;
  label: string;
}

export const IndustryList = [
  'DAOs',
  'DeFi',
  'Infrastructure',
  'DePIN',
  'Consumer dApps',
  'Wallets and Payments',
  'NFTs',
  'Gaming',
] as const;

export const web3Exp = [
  'New to crypto',
  'Occasionally contributing',
  'Contributing regularly',
] as const;

export const workExp = [
  '0 Years',
  '<2 Years',
  '2 to 5 Years',
  '5 to 9 Years',
  '>9 Years',
] as const;
export const workType = [
  'Not looking for Work',
  'Freelance',
  'Fulltime',
  'Internship',
] as const;

export const MAX_COMMENT_SUGGESTIONS = 5;

export const TERMS_OF_USE =
  'https://drive.google.com/file/d/1ybbO_UOTaIiyKb4Mbm3sNMbjTf5qj5mT/view?usp=sharing';

export const URL_REGEX =
  /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,256}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/i;

export const MAX_PODIUMS = 10;
export const MAX_BONUS_SPOTS = 50;
export const BONUS_REWARD_POSITION = 99;

export const PDTG = 'https://t.me/pratikdholani/';
export const ABTG = 'https://t.me/abhwshek/';

export const MAX_REWARD = 100_000_000_000_000; // 100 Trillion
