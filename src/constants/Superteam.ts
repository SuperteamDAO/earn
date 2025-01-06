import { Regions } from '@prisma/client';

import { ASSET_URL } from './ASSET_URL';

interface People {
  name: string;
  pfp: string;
  role?: string;
}

export interface Superteam {
  name: string;
  icons: string;
  banner: string;
  region: Regions;
  displayValue: string;
  country: string[];
  code: string;
  hello: string;
  nationality: string;
  people?: People[];
}

const basePath = ASSET_URL + '/superteams/';

export const Superteams = [
  {
    name: 'Superteam India',
    icons: basePath + 'logos/india.jpg',
    banner: basePath + 'banners/India.png',
    region: Regions.INDIA,
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
  },
  {
    name: 'Superteam Germany',
    icons: basePath + 'logos/germany.jpg',
    banner: basePath + 'banners/Germany.png',
    region: Regions.GERMANY,
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
  },
  {
    name: 'Superteam UK',
    icons: basePath + 'logos/uk.png',
    banner: basePath + 'banners/UK.png',
    region: Regions.UK,
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
  },
  {
    name: 'Superteam Turkey',
    icons: basePath + 'logos/turkey.jpg',
    banner: basePath + 'banners/Turkey.png',
    region: Regions.TURKEY,
    displayValue: 'Turkey',
    country: ['Turkey'],
    code: 'TR',
    hello: 'Merhaba',
    nationality: 'Turks',
    people: [
      {
        name: 'Ezgi Yaltay',
        pfp: 'https://pbs.twimg.com/profile_images/1573011788769247234/zOaAXiv6_400x400.jpg',
      },
    ],
  },
  {
    name: 'Superteam Vietnam',
    icons: basePath + 'logos/vietnam.png',
    banner: basePath + 'banners/Vietnam.png',
    region: Regions.VIETNAM,
    displayValue: 'Vietnam',
    country: ['Vietnam'],
    code: 'VN',
    hello: 'Xin chào',
    nationality: 'Vietnamese',
    people: [
      {
        name: 'Kelly Anh',
        pfp: 'https://pbs.twimg.com/profile_images/1686209291303497728/T-Tft6D6_400x400.jpg',
      },
      {
        name: 'Anh Tran',
        pfp: 'https://pbs.twimg.com/profile_images/1672120350266785792/a0AjrF8B_400x400.jpg',
      },
      {
        name: 'Minh Thach',
        pfp: 'https://pbs.twimg.com/profile_images/926374044030484480/it1e5gQr_400x400.jpg',
      },
    ],
  },
  {
    name: 'Superteam UAE',
    icons: basePath + 'logos/uae.png',
    banner: basePath + 'banners/UAE.png',
    region: Regions.UAE,
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
  },
  {
    name: 'Superteam Nigeria',
    icons: basePath + 'logos/nigeria.png',
    banner: basePath + 'banners/Nigeria.png',
    region: Regions.NIGERIA,
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
  },
  {
    name: 'Superteam Brazil',
    icons: basePath + 'logos/brazil.png',
    banner: basePath + 'banners/Brazil.png',
    region: Regions.BRAZIL,
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
  },
  {
    name: 'Superteam Malaysia',
    icons: basePath + 'logos/malaysia.jpg',
    banner: basePath + 'banners/Malaysia.png',
    region: Regions.MALAYSIA,
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
  },
  {
    name: 'Superteam Balkan',
    icons: basePath + 'logos/balkan.png',
    banner: basePath + 'banners/Balkan.png',
    region: Regions.BALKAN,
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
  },
  {
    name: 'Superteam Philippines',
    icons: basePath + 'logos/philippines.png',
    banner: basePath + 'banners/Philippines.png',
    region: Regions.PHILIPPINES,
    displayValue: 'Philippines',
    country: ['Philippines'],
    code: 'PH',
    hello: 'Kumusta',
    nationality: 'Filipinos',
    people: [
      {
        name: 'Eli',
        pfp: 'https://pbs.twimg.com/profile_images/1839557525529927680/AxyDcqKr_400x400.jpg',
      },
      {
        name: 'Emerson',
        pfp: 'https://pbs.twimg.com/profile_images/1787894665624305667/FF6y0ucq_400x400.jpg',
      },
    ],
  },
  {
    name: 'Superteam Japan',
    icons: basePath + 'logos/japan.png',
    banner: basePath + 'banners/Japan.png',
    region: Regions.JAPAN,
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
  },
  {
    name: 'Superteam France',
    icons: basePath + 'logos/france.png',
    banner: basePath + 'banners/France.png',
    region: Regions.FRANCE,
    displayValue: 'France',
    country: ['France'],
    code: 'FR',
    hello: `Bonjour`,
    nationality: 'French',
    people: [
      {
        name: 'Arthur',
        pfp: 'https://pbs.twimg.com/profile_images/1504225711522996232/PeaEIwzk_400x400.jpg',
      },
    ],
  },
  {
    name: 'Superteam Mexico',
    icons: basePath + 'logos/mexico.jpg',
    banner: basePath + 'banners/Mexico.png',
    region: Regions.MEXICO,
    displayValue: 'Mexico',
    country: ['Mexico'],
    code: 'MX',
    hello: `Hola`,
    nationality: 'Mexicans',
  },
  {
    name: 'Superteam Canada',
    icons: basePath + 'logos/canada.png',
    banner: basePath + 'banners/Canada.png',
    region: Regions.CANADA,
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
  },
  {
    name: 'Superteam Singapore',
    icons: basePath + 'logos/singapore.png',
    banner: basePath + 'banners/Singapore.png',
    region: Regions.SINGAPORE,
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
  },
  {
    name: 'Superteam Poland',
    icons: basePath + 'logos/poland.png',
    banner: basePath + 'banners/poland.png',
    region: Regions.POLAND,
    displayValue: 'Poland',
    country: ['Poland'],
    code: 'PL',
    hello: 'Cześć',
    nationality: 'Poles',
  },
  {
    name: 'Superteam Korea',
    icons: basePath + 'logos/korea.png',
    banner: basePath + 'banners/korea.png',
    region: Regions.KOREA,
    displayValue: 'South Korea',
    country: ['South Korea'],
    code: 'KR',
    hello: 'Annyeonghaseyo',
    nationality: 'Koreans',
  },
];

const NonSTRegions = [
  {
    region: Regions.UKRAINE,
    displayValue: 'Ukraine',
    country: ['Ukraine'],
    code: 'UA',
  },
  {
    region: Regions.ARGENTINA,
    displayValue: 'Argentina',
    country: ['Argentina'],
    code: 'AR',
  },
  {
    region: Regions.USA,
    displayValue: 'USA',
    country: ['United States'],
    code: 'US',
  },
  {
    region: Regions.SPAIN,
    displayValue: 'Spain',
    country: ['Spain'],
    code: 'ES',
  },
];

export const CombinedRegions = [...Superteams, ...NonSTRegions];
