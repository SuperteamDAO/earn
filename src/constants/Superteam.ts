import { ASSET_URL } from './ASSET_URL';

interface People {
  name: string;
  pfp: string;
  role?: string;
}

const REGIONS = [
  'Global',
  'India',
  'Vietnam',
  'Germany',
  'Turkey',
  'Mexico',
  'United Kingdom',
  'UAE',
  'Nigeria',
  'Israel',
  'Brazil',
  'Malaysia',
  'Balkan',
  'Philippines',
  'Japan',
  'France',
  'Canada',
  'Singapore',
  'Poland',
  'South Korea',
  'Ireland',
  'Kazakhstan',
  'Indonesia',
  'Ukraine',
  'Argentina',
  'USA',
  'Spain',
  'Georgia',
  'Netherlands',
] as const;

export type Region = (typeof REGIONS)[number];

export interface Superteam {
  name: string;
  icons: string;
  banner: string;
  region: Region;
  displayValue: string;
  country: string[];
  code: string;
  hello: string;
  nationality: string;
  people?: People[];
  slug: string;
  link: string;
}

const basePath = ASSET_URL + '/superteams/';

export const Superteams = [
  {
    name: 'Superteam India',
    icons: basePath + 'logos/india.jpg',
    banner: basePath + 'banners/India.png',
    region: 'India' as Region,
    displayValue: 'India',
    country: ['India'],
    code: 'IN',
    hello: 'Namaste',
    nationality: 'Indians',
    people: [
      {
        name: 'Aditya Shetty',
        pfp: 'https://pbs.twimg.com/profile_images/1779139453409222656/ueIqRcnn_400x400.jpg',
      },
      {
        name: 'Shek',
        pfp: 'https://pbs.twimg.com/profile_images/1803645845352378368/DifayeJH_400x400.jpg',
      },
    ],
    slug: 'india',
    link: 'https://x.com/SuperteamIN/',
  },
  {
    name: 'Superteam Germany',
    icons: basePath + 'logos/germany.jpg',
    banner: basePath + 'banners/Germany.png',
    region: 'Germany' as Region,
    displayValue: 'Germany',
    country: ['Germany'],
    code: 'DE',
    hello: 'Hallo',
    nationality: 'Germans',
    people: [
      {
        name: 'Carlo',
        pfp: 'https://pbs.twimg.com/profile_images/1697301254819516416/kNuQeyH7_400x400.jpg',
      },
      {
        name: 'Patti',
        pfp: 'https://pbs.twimg.com/profile_images/1801333126272008192/Yvn8CtqM_400x400.jpg',
      },
    ],
    slug: 'germany',
    link: 'https://x.com/SuperteamDE',
  },

  {
    name: 'Superteam Nigeria',
    icons: basePath + 'logos/nigeria.png',
    banner: basePath + 'banners/Nigeria.png',
    region: 'Nigeria' as Region,
    displayValue: 'Nigeria',
    country: ['Nigeria'],
    code: 'NG',
    hello: 'Hello',
    nationality: 'Nigerians',
    people: [
      {
        name: 'Nzube',
        pfp: 'https://pbs.twimg.com/profile_images/1849227147354714112/ryBAAooX_400x400.jpg',
      },
      {
        name: 'Harri',
        pfp: 'https://pbs.twimg.com/profile_images/1837323392959270913/PpGQRio3_400x400.jpg',
      },
    ],
    slug: 'nigeria',
    link: 'https://x.com/superteamng',
  },
  {
    name: 'Superteam Brazil',
    icons: basePath + 'logos/brazil.png',
    banner: basePath + 'banners/Brazil.png',
    region: 'Brazil' as Region,
    displayValue: 'Brazil',
    country: ['Brazil'],
    code: 'BR',
    hello: 'Olá',
    nationality: 'Brazilians',
    people: [
      {
        name: 'Diego Dias',
        pfp: 'https://res.cloudinary.com/dgvnuwspr/image/upload/diego-dias.jpg',
      },
    ],
    slug: 'brazil',
    link: 'https://x.com/superteambr',
  },
  {
    name: 'Superteam Kazakhstan',
    icons: basePath + 'logos/kazakhstan',
    banner: basePath + 'banners/kazakhstan',
    region: 'Kazakhstan' as Region,
    displayValue: 'Kazakhstan',
    country: ['Kazakhstan'],
    code: 'KZ',
    hello: 'Sälem',
    nationality: 'Kazakhstans',
    slug: 'kazakhstan',
    link: 'https://x.com/SuperteamKZ',
  },
  {
    name: 'Superteam Malaysia',
    icons: basePath + 'logos/malaysia.jpg',
    banner: basePath + 'banners/Malaysia.png',
    region: 'Malaysia' as Region,
    displayValue: 'Malaysia',
    country: ['Malaysia'],
    code: 'MY',
    hello: 'Salaam',
    nationality: 'Malaysians',
    people: [
      {
        name: 'Henry',
        pfp: 'https://pbs.twimg.com/profile_images/1475080610100047874/GB_awKP9_400x400.jpg',
      },
    ],
    slug: 'malaysia',
    link: 'https://x.com/SuperteamMY',
  },
  {
    name: 'Superteam Balkan',
    icons: basePath + 'logos/balkan.png',
    banner: basePath + 'banners/Balkan.png',
    region: 'Balkan' as Region,
    displayValue: 'Balkan',
    country: [
      'Albania',
      'Bosnia and Herzegovina',
      'Bulgaria',
      'Croatia',
      'Kosovo',
      'Montenegro',
      'North Macedonia',
      'Romania',
      'Serbia',
      'Slovenia',
      'Greece',
    ],
    code: 'BALKAN',
    hello: 'Pozdrav',
    nationality: 'Balkans',
    people: [
      {
        name: 'Primordial',
        pfp: 'https://pbs.twimg.com/profile_images/1722590250076123137/2XQPr92C_400x400.jpg',
      },
      {
        name: 'Matija',
        pfp: 'https://pbs.twimg.com/profile_images/1763670773091160064/y02448TX_400x400.jpg',
      },
    ],
    slug: 'balkan',
    link: 'https://x.com/SuperteamBLKN',
  },
  {
    name: 'Superteam Korea',
    icons: basePath + 'logos/korea.png',
    banner: basePath + 'banners/korea.png',
    region: 'South Korea' as Region,
    displayValue: 'South Korea',
    country: ['South Korea'],
    code: 'KR',
    hello: 'Annyeonghaseyo',
    nationality: 'Koreans',
    slug: 'korea',
    link: 'https://x.com/superteamkorea',
  },
  {
    name: 'Superteam Canada',
    icons: basePath + 'logos/canada.png',
    banner: basePath + 'banners/Canada.png',
    region: 'Canada' as Region,
    displayValue: 'Canada',
    country: ['Canada'],
    code: 'CA',
    hello: 'Hello',
    nationality: 'Canadians',
    people: [
      {
        name: 'Simon',
        pfp: 'https://pbs.twimg.com/profile_images/1702658848497016833/dGloS-Hw_400x400.jpg',
      },
    ],
    slug: 'canada',
    link: 'https://x.com/SuperteamCAN',
  },
  {
    name: 'Superteam Singapore',
    icons: basePath + 'logos/singapore.png',
    banner: basePath + 'banners/Singapore.png',
    region: 'Singapore' as Region,
    displayValue: 'Singapore',
    country: ['Singapore'],
    code: 'SG',
    hello: 'Hello',
    nationality: 'Singaporeans',
    people: [
      {
        name: 'Nick Tong',
        pfp: 'https://pbs.twimg.com/profile_images/859254261418303489/1VGdiak1_400x400.jpg',
      },
    ],
    slug: 'singapore',
    link: 'https://x.com/SuperteamSG',
  },
  {
    name: 'Superteam Poland',
    icons: basePath + 'logos/poland.png',
    banner: basePath + 'banners/poland.png',
    region: 'Poland' as Region,
    displayValue: 'Poland',
    country: ['Poland'],
    code: 'PL',
    hello: 'Cześć',
    nationality: 'Poles',
    slug: 'poland',
    link: 'https://x.com/SuperteamPOL',
  },
  {
    name: 'Superteam Indonesia',
    icons: basePath + 'logos/indonesia',
    banner: basePath + 'banners/indonesia',
    region: 'Indonesia' as Region,
    displayValue: 'Indonesia',
    country: ['Indonesia'],
    code: 'ID',
    hello: 'Halo',
    nationality: 'Indonesians',
    slug: 'indonesia',
    link: 'https://x.com/SuperteamINDO',
  },
  {
    name: 'Superteam Netherlands',
    icons: basePath + 'logos/netherlands.jpg',
    banner: basePath + 'banners/netherlands',
    region: 'Netherlands' as Region,
    displayValue: 'Netherlands',
    country: ['Netherlands'],
    code: 'NL',
    hello: 'Hallo',
    nationality: 'Dutch',
    slug: 'netherlands',
    link: '',
  },
  {
    name: 'Superteam Japan',
    icons: basePath + 'logos/japan.png',
    banner: basePath + 'banners/Japan.png',
    region: 'Japan' as Region,
    displayValue: 'Japan',
    country: ['Japan'],
    code: 'JP',
    hello: `Kon'nichiwa`,
    nationality: 'Japanese',
    people: [
      {
        name: 'Hisashi',
        pfp: 'https://pbs.twimg.com/profile_images/1855760707347972096/a0qO66Yb_400x400.png',
      },
    ],
    slug: 'japan',
    link: 'https://x.com/SuperteamJapan',
  },
  {
    name: 'Superteam UK',
    icons: basePath + 'logos/uk.png',
    banner: basePath + 'banners/UK.png',
    region: 'United Kingdom' as Region,
    displayValue: 'UK',
    country: ['United Kingdom'],
    code: 'GB',
    hello: 'Hello',
    nationality: 'the British',
    people: [
      {
        name: 'Cap',
        pfp: 'https://pbs.twimg.com/profile_images/1809162104521261056/6dg1nUeM_400x400.jpg',
      },
    ],
    slug: 'uk',
    link: 'https://x.com/superteamuk',
  },
  {
    name: 'Superteam UAE',
    icons: basePath + 'logos/uae.png',
    banner: basePath + 'banners/UAE.png',
    region: 'UAE' as Region,
    displayValue: 'UAE',
    country: ['United Arab Emirates'],
    code: 'AE',
    hello: 'Marhaba',
    nationality: 'Emiratis',
    people: [
      {
        name: 'Alex Scott',
        pfp: 'https://pbs.twimg.com/profile_images/1638831283416473600/UrbqFJ4s_400x400.jpg',
      },
    ],
    slug: 'uae',
    link: 'https://x.com/SuperteamAE',
  },
  {
    name: 'Superteam Georgia',
    icons: basePath + 'logos/georgia.jpg',
    banner: basePath + 'banners/georgia',
    region: 'Georgia' as Region,
    displayValue: 'Georgia',
    country: ['Georgia'],
    code: 'GE',
    hello: 'Gamarjoba',
    nationality: 'Georgians',
    slug: 'georgia',
    link: '',
  },
  {
    name: 'Superteam Ireland',
    icons: basePath + 'logos/ireland.jpg',
    banner: basePath + 'banners/Ireland.png',
    region: 'Ireland' as Region,
    displayValue: 'Ireland',
    country: ['Ireland (NI and ROI)'],
    code: 'IE',
    hello: 'Dia duit',
    nationality: 'Irish',
    slug: 'ireland',
    link: 'https://x.com/superteamie',
  },
  {
    name: 'Superteam Spain',
    icons: basePath + 'logos/spain.jpg',
    banner: basePath + 'banners/spain',
    region: 'Spain' as Region,
    displayValue: 'Spain',
    country: ['Spain'],
    code: 'ES',
    hello: 'Hola',
    nationality: 'Spaniards',
    slug: 'spain',
    link: 'https://x.com/LaFamilia_so',
  },
  {
    name: 'Superteam Ukraine',
    icons: basePath + 'logos/ukraine.jpg',
    banner: basePath + 'banners/ukraine',
    region: 'Ukraine' as Region,
    displayValue: 'Ukraine',
    country: ['Ukraine'],
    code: 'UA',
    hello: 'Привіт',
    nationality: 'Ukrainians',
    slug: 'ukraine',
    link: 'https://x.com/KumekaTeam',
  },
];

const NonSTRegions = [
  {
    region: 'Argentina' as Region,
    displayValue: 'Argentina',
    country: ['Argentina'],
    code: 'AR',
  },
  {
    region: 'USA' as Region,
    displayValue: 'USA',
    country: ['United States'],
    code: 'US',
  },
];

export const unofficialSuperteams = [
  {
    name: 'Superteam Pakistan',
    displayValue: 'Pakistan',
    region: 'PAKISTAN',
    country: ['Pakistan'],
    code: 'PK',
    icons: basePath + 'logos/pakistan',
  },
  {
    name: 'Superteam Nepal',
    displayValue: 'Nepal',
    region: 'NEPAL',
    country: ['Nepal'],
    code: 'NP',
    icons: basePath + 'logos/nepal',
  },
];

export const CombinedRegions = [...Superteams, ...NonSTRegions];
