import { Superteams } from '@/constants/Superteam';

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

export const USERNAME_PATTERN = /^[a-z0-9_-]+$/;

const superteams = Superteams.map((team) => team.name);

export const CommunityList = [
  ...superteams,
  'SuperWomenDao',
  'LamportDAO',
  "Grape / Dean's List",
  'DeveloperDAO',
  'Metacamp',
  '10K Designers',
  'Rise In',
  'Turbin3',
  'Christex Foundation',
  'Forma',
  'DevForce99',
  'Other',
];

export const ONBOARDING_KEY = 'onboarding_chosen';
