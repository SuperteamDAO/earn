import { Regions } from '@prisma/client';

export const Superteams = [
  {
    name: 'Solar',
    icons: '/assets/superteams/logosturkey.jpg',
    banner: '/assets/superteams/banners/Turkey.png',
    region: Regions.CHINA,
    displayValue: 'China',
    country: ['China'],
    code: 'CN',
    hello: '你好',
  },
];

// const NonSTRegions = [];

export const CombinedRegions = [...Superteams];
