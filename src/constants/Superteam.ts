import { Regions } from '@prisma/client';

export const Superteams = [
  {
    name: 'Solar',
    icons: '/assets/superteams/logos/solar.png',
    banner: '/assets/superteams/banners/china.jpg',
    region: Regions.CHINA,
    displayValue: 'Solar',
    country: ['China'],
    code: 'CN',
    hello: '你好',
  },
];

// const NonSTRegions = [];

export const CombinedRegions = [...Superteams];
