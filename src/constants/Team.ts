import { Regions } from '@prisma/client';

interface People {
  name: string;
  pfp: string;
  role?: string;
}

export interface Team {
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
  airtableKey?: string;
}

export const TeamRegions: Team[] = [];

export const OtherRegions = [
  {
    region: Regions.INDIA,
    displayValue: 'India',
    country: ['India'],
    code: 'IN',
  },
  {
    region: Regions.GERMANY,
    displayValue: 'Germany',
    country: ['Germany'],
    code: 'DE',
  },
  {
    region: Regions.UK,
    displayValue: 'UK',
    country: ['United Kingdom'],
    code: 'GB',
  },
  {
    region: Regions.TURKEY,
    displayValue: 'Turkey',
    country: ['Turkey'],
    code: 'TR',
  },
  {
    region: Regions.VIETNAM,
    displayValue: 'Vietnam',
    country: ['Vietnam'],
    code: 'VN',
  },
  {
    region: Regions.UAE,
    displayValue: 'UAE',
    country: ['United Arab Emirates'],
    code: 'AE',
  },
  {
    region: Regions.NIGERIA,
    displayValue: 'Nigeria',
    country: ['Nigeria'],
    code: 'NG',
  },
  {
    region: Regions.BRAZIL,
    displayValue: 'Brazil',
    country: ['Brazil'],
    code: 'BR',
  },
  {
    region: Regions.MALAYSIA,
    displayValue: 'Malaysia',
    country: ['Malaysia'],
    code: 'MY',
  },
  {
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
  },
  {
    region: Regions.PHILIPPINES,
    displayValue: 'Philippines',
    country: ['Philippines'],
    code: 'PH',
  },
  {
    region: Regions.JAPAN,
    displayValue: 'Japan',
    country: ['Japan'],
    code: 'JP',
  },
  {
    region: Regions.FRANCE,
    displayValue: 'France',
    country: ['France'],
    code: 'FR',
  },
  {
    region: Regions.MEXICO,
    displayValue: 'Mexico',
    country: ['Mexico'],
    code: 'MX',
  },
  {
    region: Regions.CANADA,
    displayValue: 'Canada',
    country: ['Canada'],
    code: 'CA',
  },
  {
    region: Regions.SINGAPORE,
    displayValue: 'Singapore',
    country: ['Singapore'],
    code: 'SG',
  },
  {
    region: Regions.POLAND,
    displayValue: 'Poland',
    country: ['Poland'],
    code: 'PL',
  },
  {
    region: Regions.KOREA,
    displayValue: 'South Korea',
    country: ['South Korea'],
    code: 'KR',
  },
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

export const CombinedRegions = [...TeamRegions, ...OtherRegions];
