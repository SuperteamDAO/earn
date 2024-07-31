import { Superteams } from '@/constants/Superteam';

import { type SuperteamOption, type TSXTYPE } from './types';

export const REDIS_PREFIX = 'miscon';

export const colors: Record<TSXTYPE, string> = {
  all: '#64748B',
  grants: '#22C55E',
  'st-earn': '#3B82F6',
  miscellaneous: '#EAB308',
};

export const globalLead: SuperteamOption = {
  value: 'global',
  label: 'Global Lead',
  superteam: {
    name: 'Global Lead',
    logo: '/assets/global.png',
  },
};

export const superteamLists: SuperteamOption[] = [
  globalLead,
  ...Superteams.map((s) => ({
    value: s.region,
    label: s.displayValue,
    superteam: {
      name: s.displayValue,
      logo: s.icons,
    },
  })),
];

export const quickLinks = [
  {
    text: 'Community GDP',
    href: 'https://playbook.superteam.fun/community-gdp',
  },
  {
    text: 'Payment Pipeline Process',
    href: 'https://playbook.superteam.fun/guides/payment-pipeline-process',
  },
  {
    text: 'ST Points of Contact',
    href: 'https://playbook.superteam.fun/guides/points-of-contact',
  },
  { text: 'Stats Dashboard', href: 'https://stats.superteam.fun/login' },
  { text: 'Reputation Dashboard', href: 'https://reputation.superteam.fun/' },
  {
    text: 'Superteam Operations Guide',
    href: 'https://playbook.superteam.fun/guides/guide-to-superteam-operations',
  },
  {
    text: 'Global Link Repository',
    href: 'https://playbook.superteam.fun/guides/global-link-repository',
  },
];
