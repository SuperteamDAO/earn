import type { Experience } from '../interface/listings';

export interface MultiSelectOptions {
  value: string;
  label: string;
}
export const IndustryList: MultiSelectOptions[] = [
  {
    label: 'DAOs',
    value: 'DAOs',
  },
  {
    label: 'DeFi',
    value: 'DeFi',
  },
  {
    label: 'Gaming',
    value: 'Gaming',
  },
  {
    label: 'Infrastructure',
    value: 'Infrastructure',
  },
  {
    label: 'NFTs',
    value: 'NFTs',
  },
  {
    label: 'Wallets and Payments',
    value: 'Wallets and Payments',
  },
  {
    value: 'Consumer dApps',
    label: 'Consumer dApps',
  },
];

export const tokenList = [
  {
    tokenName: 'USDC',
    tokenSymbol: 'USDC',
    mintAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3408.png',
    decimals: 6,
  },
  {
    tokenName: 'Solana (SOL)',
    tokenSymbol: 'SOL',
    mintAddress: '', // need to change it
    address: '', // need to change
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/16116.png',
    decimals: 9,
  },
  {
    tokenName: 'ISC',
    tokenSymbol: 'ISC',
    mintAddress: '',
    address: '',
    icon: 'https://res.cloudinary.com/dgvnuwspr/image/upload/v1683200072/sponsors/International%20Stable%20Currency.png',
  },
  {
    tokenName: 'USDT',
    tokenSymbol: 'USDT',
    mintAddress: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/825.png',
    decimals: 6,
  },
  {
    tokenName: 'STEP',
    tokenSymbol: 'STEP',
    mintAddress: '',
    address: '',
    icon: 'https://assets.coingecko.com/coins/images/14988/small/step.png?1619274762',
    decimals: 6,
  },
  {
    tokenName: 'mSOL',
    tokenSymbol: 'mSOL',
    mintAddress: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
    address: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/11461.png',
    decimals: 9,
  },
  {
    tokenName: 'UXD Stablecoin (UXD)',
    tokenSymbol: 'UXD',
    mintAddress: '7kbnvuGBxxj8AG9qp8Scn56muWGaRaFqxg1FsRp3PaFT',
    address: '7kbnvuGBxxj8AG9qp8Scn56muWGaRaFqxg1FsRp3PaFT',
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/17535.png',
    decimals: 6,
  },
  {
    tokenName: 'Raydium (RAY)',
    tokenSymbol: 'RAY',
    mintAddress: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
    address: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/8526.png',
  },
  {
    tokenName: 'Saber (SBR)',
    tokenSymbol: 'SBR',
    mintAddress: 'Saber2gLauYim4Mvftnrasomsv6NvAuncvMEZwcLpD1',
    address: 'Saber2gLauYim4Mvftnrasomsv6NvAuncvMEZwcLpD1',
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/11181.png',
  },
  {
    tokenName: 'Solend (SLND)',
    tokenSymbol: 'SLND',
    mintAddress: 'SLNDpmoWTVADgEdndyvWzroNL7zSi1dF9PC3xHGtPwp',
    address: 'SLNDpmoWTVADgEdndyvWzroNL7zSi1dF9PC3xHGtPwp',
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/13524.png',
  },
  {
    tokenName: 'Coin98 (C98)',
    tokenSymbol: 'C98',
    mintAddress: 'C98A4nkJXhpVZNAZdHUA95RpTF3T4whtQubL3YobiUX9',
    address: 'C98A4nkJXhpVZNAZdHUA95RpTF3T4whtQubL3YobiUX9',
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/10903.png',
  },
  {
    tokenName: 'Serum (SRM)',
    tokenSymbol: 'SRM',
    mintAddress: 'SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt',
    address: 'SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt',
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/6187.png',
  },
  {
    tokenName: 'DUST Protocol (DUST)',
    tokenSymbol: 'DUST',
    mintAddress: 'DUSTawucrTsGU8hcqRdHDCbuYhCPADMLM2VcCb8VnFnQ',
    address: 'DUSTawucrTsGU8hcqRdHDCbuYhCPADMLM2VcCb8VnFnQ',
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/18802.png',
  },
  {
    tokenName: 'wrapped Solana (wSOL)',
    tokenSymbol: 'wSOL',
    mintAddress: 'So11111111111111111111111111111111111111112',
    address: 'So11111111111111111111111111111111111111112',
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/16116.png',
  },
  {
    tokenName: 'Bonfida (FIDA)',
    tokenSymbol: 'FIDA',
    mintAddress: 'EchesyfXePKdLtoiZSL8pBe8Myagyy8ZRqsACNCFGnvp',
    address: 'EchesyfXePKdLtoiZSL8pBe8Myagyy8ZRqsACNCFGnvp',
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/7978.png',
  },
  {
    tokenName: 'Orca (ORCA)',
    tokenSymbol: 'ORCA',
    mintAddress: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE',
    address: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE',
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/11165.png',
  },
];
export const MainSkills: MultiSelectOptions[] = [
  {
    label: 'Frontend',
    value: 'Frontend',
  },
  {
    label: 'Backend',
    value: 'Backend',
  },
  {
    label: 'Blockchain',
    value: 'Blockchain',
  },
  {
    label: 'Fullstack',
    value: 'Fullstack',
  },
  {
    label: 'Mobile',
    value: 'Mobile',
  },
  {
    label: 'Design',
    value: 'Design',
  },
  {
    label: 'Community',
    value: 'Community',
  },
  {
    label: 'Growth',
    value: 'Growth',
  },
  {
    label: 'Content',
    value: 'Content',
  },
  {
    label: 'Other',
    value: 'Other',
  },
];

export const skillSubSkillMap = {
  Frontend: [
    {
      label: 'React',
      value: 'React',
    },
    {
      label: 'Angular',
      value: 'Angular',
    },
    {
      label: 'Vue',
      value: 'Vue',
    },
    {
      label: 'Redux',
      value: 'Redux',
    },
  ],
  Backend: [
    {
      label: 'Javascript',
      value: 'Javascript',
    },
    {
      label: 'PHP',
      value: 'PHP',
    },
    {
      label: 'Python',
      value: 'Python',
    },
    {
      label: 'Java',
      value: 'Java',
    },
    {
      label: 'C++',
      value: 'C++',
    },
    {
      label: 'C',
      value: 'C',
    },
    {
      label: 'Ruby',
      value: 'Ruby',
    },
    {
      label: 'Go',
      value: 'Go',
    },
    {
      label: 'MySQL',
      value: 'MySQL',
    },
    {
      label: 'Postgres',
      value: 'Postgres',
    },
    {
      label: 'MongoDB',
      value: 'MongoDB',
    },
  ],
  Blockchain: [
    {
      label: 'Rust',
      value: 'Rust',
    },
    {
      label: 'Solidity',
      value: 'Solidity',
    },
    {
      label: 'Move',
      value: 'Move',
    },
  ],
  Mobile: [
    {
      label: 'Android',
      value: 'Android',
    },
    {
      label: 'iOS',
      value: 'iOS',
    },
    {
      label: 'Flutter',
      value: 'Flutter',
    },
    {
      label: 'React Native',
      value: 'React Native',
    },
  ],
  Design: [
    {
      label: 'UI/UX Design',
      value: 'UI/UX Design',
    },
    {
      label: 'Graphic Design',
      value: 'Graphic Design',
    },
    {
      label: 'Illustration',
      value: 'Illustration',
    },
    {
      label: 'Game Design',
      value: 'Game Design',
    },
    {
      label: 'Presentation Design',
      value: 'Presentation Design',
    },
  ],
  Community: [
    {
      label: 'Community Manager',
      value: 'Community Manager',
    },
    {
      label: 'Discord Moderator',
      value: 'Discord Moderator',
    },
  ],
  Growth: [
    {
      label: 'Business Development',
      value: 'Business Development',
    },
    {
      label: 'Digital Marketing',
      value: 'Digital Marketing',
    },
    {
      label: 'Marketing',
      value: 'Marketing',
    },
  ],
  Content: [
    {
      label: 'Research',
      value: 'Research',
    },
    {
      label: 'Video',
      value: 'Video',
    },
    {
      label: 'Writing',
      value: 'Writing',
    },
    {
      label: 'Social Media',
      value: 'Social Media',
    },
  ],
  Other: [
    {
      label: 'Data Analytics',
      value: 'Data Analytics',
    },
    {
      label: 'Operations',
      value: 'Operations',
    },
  ],
  Fullstack: [
    {
      label: 'Javascript',
      value: 'Javascript',
    },
    {
      label: 'PHP',
      value: 'PHP',
    },
    {
      label: 'Python',
      value: 'Python',
    },
    {
      label: 'Java',
      value: 'Java',
    },
    {
      label: 'C++',
      value: 'C++',
    },
    {
      label: 'C',
      value: 'C',
    },
    {
      label: 'Ruby',
      value: 'Ruby',
    },
    {
      label: 'Go',
      value: 'Go',
    },
    {
      label: 'MySQL',
      value: 'MySQL',
    },
    {
      label: 'Postgres',
      value: 'Postgres',
    },
    {
      label: 'MongoDB',
      value: 'MongoDB',
    },
    {
      label: 'React',
      value: 'React',
    },
    {
      label: 'Angular',
      value: 'Angular',
    },
    {
      label: 'Vue',
      value: 'Vue',
    },
    {
      label: 'Redux',
      value: 'Redux',
    },
  ],
};
export const SubSkills: MultiSelectOptions[] = [
  {
    label: 'React',
    value: 'React',
  },
  {
    label: 'Angular',
    value: 'Angular',
  },
  {
    label: 'Vue',
    value: 'Vue',
  },
  {
    label: 'Redux',
    value: 'Redux',
  },
  {
    label: 'Rust',
    value: 'Rust',
  },
  {
    label: 'Solidity',
    value: 'Solidity',
  },
  {
    label: 'Move',
    value: 'Move',
  },
  {
    label: 'Javascript',
    value: 'Javascript',
  },
  {
    label: 'PHP',
    value: 'PHP',
  },
  {
    label: 'Python',
    value: 'Python',
  },
  {
    label: 'Java',
    value: 'Java',
  },
  {
    label: 'C++',
    value: 'C++',
  },
  {
    label: 'C',
    value: 'C',
  },
  {
    label: 'Ruby',
    value: 'Ruby',
  },
  {
    label: 'Go',
    value: 'Go',
  },
  {
    label: 'MySQL',
    value: 'MySQL',
  },
  {
    label: 'Postgres',
    value: 'Postgres',
  },
  {
    label: 'MongoDB',
    value: 'MongoDB',
  },
  {
    label: 'Data Analytics',
    value: 'Data Analytics',
  },
  {
    label: 'Operations',
    value: 'Operations',
  },
  {
    label: 'Community Manager',
    value: 'Community Manager',
  },
  {
    label: 'Discord Moderator',
    value: 'Discord Moderator',
  },
  {
    label: 'Research',
    value: 'Research',
  },
  {
    label: 'Video',
    value: 'Video',
  },
  {
    label: 'Writing',
    value: 'Writing',
  },
  {
    label: 'Social Media',
    value: 'Social Media',
  },
  {
    label: 'Business Development',
    value: 'Business Development',
  },
  {
    label: 'Digital Marketing',
    value: 'Digital Marketing',
  },
  {
    label: 'Marketing',
    value: 'Marketing',
  },
  {
    label: 'UI/UX Design',
    value: 'UI/UX Design',
  },
  {
    label: 'Graphic Design',
    value: 'Graphic Design',
  },
  {
    label: 'Illustration',
    value: 'Illustration',
  },
  {
    label: 'Game Design',
    value: 'Game Design',
  },
  {
    label: 'Presentation Design',
    value: 'Presentation Design',
  },
  {
    label: 'Android',
    value: 'Android',
  },
  {
    label: 'iOS',
    value: 'iOS',
  },
  {
    label: 'Flutter',
    value: 'Flutter',
  },
  {
    label: 'React Native',
    value: 'React Native',
  },
];
export const ExperienceList: Experience[] = [
  '0 Yrs: Fresher/Graduate ',
  '0-1 Yrs: Some Experience Required',
  '1-5 Yrs: Early Career Professional',
  '5-10 Yrs: Mid Career Professional',
  '10 Yrs+: Senior Professional',
];
export const TimeZoneList: MultiSelectOptions[] = [
  {
    label: 'Asia',
    value: 'Asia',
  },
  {
    label: 'India',
    value: 'India',
  },
  {
    label: 'North/South America',
    value: 'North/South America',
  },
  {
    label: 'APAC',
    value: 'APAC',
  },
  {
    label: 'EMEA',
    value: 'EMEA',
  },
  {
    label: 'All',
    value: 'All',
  },
];
export const PrizeList = ['first', 'second', 'third', 'forth', 'fifth'];

export const ListingTypeQueryMap = {
  Jobs: 'jobs',
  Bounties: 'bounties',
  Grants: 'grants',
};

export const CountryList: string[] = [
  'India',
  'Afghanistan',
  'Albania',
  'Algeria',
  'American Samoa',
  'Andorra',
  'Angola',
  'Anguilla',
  'Antarctica',
  'Antigua and/or Barbuda',
  'Argentina',
  'Armenia',
  'Aruba',
  'Australia',
  'Austria',
  'Azerbaijan',
  'Bahamas',
  'Bahrain',
  'Bangladesh',
  'Barbados',
  'Belarus',
  'Belgium',
  'Belize',
  'Benin',
  'Bermuda',
  'Bhutan',
  'Bolivia',
  'Bosnia and Herzegovina',
  'Botswana',
  'Bouvet Island',
  'Brazil',
  'British Indian Ocean Territory',
  'Brunei Darussalam',
  'Bulgaria',
  'Burkina Faso',
  'Burundi',
  'Cambodia',
  'Cameroon',
  'Canada',
  'Cape Verde',
  'Cayman Islands',
  'Central African Republic',
  'Chad',
  'Chile',
  'China',
  'Christmas Island',
  'Cocos (Keeling) Islands',
  'Colombia',
  'Comoros',
  'Congo',
  'Cook Islands',
  'Costa Rica',
  'Croatia (Hrvatska)',
  'Cuba',
  'Cyprus',
  'Czech Republic',
  'Denmark',
  'Djibouti',
  'Dominica',
  'Dominican Republic',
  'East Timor',
  'Ecuador',
  'Egypt',
  'El Salvador',
  'Equatorial Guinea',
  'Eritrea',
  'Estonia',
  'Ethiopia',
  'Falkland Islands (Malvinas)',
  'Faroe Islands',
  'Fiji',
  'Finland',
  'France',
  'France, Metropolitan',
  'French Guiana',
  'French Polynesia',
  'French Southern Territories',
  'Gabon',
  'Gambia',
  'Georgia',
  'Germany',
  'Ghana',
  'Gibraltar',
  'Greece',
  'Greenland',
  'Grenada',
  'Guadeloupe',
  'Guam',
  'Guatemala',
  'Guinea',
  'Guinea-Bissau',
  'Guyana',
  'Haiti',
  'Heard and Mc Donald Islands',
  'Honduras',
  'Hong Kong',
  'Hungary',
  'Iceland',
  'Indonesia',
  'Iran (Islamic Republic of)',
  'Iraq',
  'Ireland',
  'Israel',
  'Italy',
  'Ivory Coast',
  'Jamaica',
  'Japan',
  'Jordan',
  'Kazakhstan',
  'Kenya',
  'Kiribati',
  "Korea, Democratic People's Republic of",
  'Korea, Republic of',
  'Kuwait',
  'Kyrgyzstan',
  "Lao People's Democratic Republic",
  'Latvia',
  'Lebanon',
  'Lesotho',
  'Liberia',
  'Libyan Arab Jamahiriya',
  'Liechtenstein',
  'Lithuania',
  'Luxembourg',
  'Macau',
  'Macedonia',
  'Madagascar',
  'Malawi',
  'Malaysia',
  'Maldives',
  'Mali',
  'Malta',
  'Marshall Islands',
  'Martinique',
  'Mauritania',
  'Mauritius',
  'Mayotte',
  'Mexico',
  'Micronesia, Federated States of',
  'Moldova, Republic of',
  'Monaco',
  'Mongolia',
  'Montserrat',
  'Morocco',
  'Mozambique',
  'Myanmar',
  'Namibia',
  'Nauru',
  'Nepal',
  'Netherlands',
  'Netherlands Antilles',
  'New Caledonia',
  'New Zealand',
  'Nicaragua',
  'Niger',
  'Nigeria',
  'Niue',
  'Norfolk Island',
  'Northern Mariana Islands',
  'Norway',
  'Oman',
  'Pakistan',
  'Palau',
  'Panama',
  'Papua New Guinea',
  'Paraguay',
  'Peru',
  'Philippines',
  'Pitcairn',
  'Poland',
  'Portugal',
  'Puerto Rico',
  'Qatar',
  'Reunion',
  'Romania',
  'Russian Federation',
  'Rwanda',
  'Saint Kitts and Nevis',
  'Saint Lucia',
  'Saint Vincent and the Grenadines',
  'Samoa',
  'San Marino',
  'Sao Tome and Principe',
  'Saudi Arabia',
  'Senegal',
  'Seychelles',
  'Sierra Leone',
  'Singapore',
  'Slovakia',
  'Slovenia',
  'Solomon Islands',
  'Somalia',
  'South Africa',
  'South Georgia South Sandwich Islands',
  'Spain',
  'Sri Lanka',
  'St. Helena',
  'St. Pierre and Miquelon',
  'Sudan',
  'Suriname',
  'Svalbard and Jan Mayen Islands',
  'Swaziland',
  'Sweden',
  'Switzerland',
  'Syrian Arab Republic',
  'Taiwan',
  'Tajikistan',
  'Tanzania, United Republic of',
  'Thailand',
  'Togo',
  'Tokelau',
  'Tonga',
  'Trinidad and Tobago',
  'Tunisia',
  'Turkey',
  'Turkmenistan',
  'Turks and Caicos Islands',
  'Tuvalu',
  'Uganda',
  'Ukraine',
  'United Arab Emirates',
  'United Kingdom',
  'United States',
  'United States minor outlying islands',
  'Uruguay',
  'Uzbekistan',
  'Vanuatu',
  'Vatican City State',
  'Venezuela',
  'Vietnam',
  'Virgin Islands (British)',
  'Virgin Islands (U.S.)',
  'Wallis and Futuna Islands',
  'Western Sahara',
  'Yemen',
  'Yugoslavia',
  'Zaire',
  'Zambia',
  'Zimbabwe',
];

export const CommunityList: string[] = [
  'LamportDAO',
  "Grape / Dean's List",
  'Superteam India',
  'Superteam Mexico',
  'Superteam Vietnam',
  'Superteam Germany',
  'Superteam Turkey',
  'Superteam UK',
  'Superteam UAE',
  'SuperWomenDao',
  'DeveloperDAO',
  'Metacamp',
  '10K Designers',
];

export const CommunityImage: { [key in string]: string } = {
  Superteam: '/assets/talent/superteam-logo.png',
  LamportDAO:
    'https://white-chemical-flamingo-683.mypinata.cloud/ipfs/QmSdqwxpmr2ouFFTapMbywqiBoEzJ3NBUEsAAZ8szB72Sj',
  "Grape / Dean's List":
    'https://white-chemical-flamingo-683.mypinata.cloud/ipfs/QmWQEuQiVMBcdw8DgdddvbZ4d2s4xyoy1aCCmrkeRj8tGk',
  SuperWomenDao:
    'https://white-chemical-flamingo-683.mypinata.cloud/ipfs/QmPiU1v6mLdn37kikdJ3NRfjJdTFRf26Tv6cAU7veHx3EA',
  DeveloperDAO:
    'https://white-chemical-flamingo-683.mypinata.cloud/ipfs/QmQUKa7gHjsdpqk7Vt2z5ZSA4P6Kgn3CRBkTvWquNVo7w3',
  Metacamp:
    'https://white-chemical-flamingo-683.mypinata.cloud/ipfs/QmUzZWzWhAZuuMPjnwcqLbbyJJB48NhaaA78cFTyzbkGZc',
  '10K Designers':
    'https://white-chemical-flamingo-683.mypinata.cloud/ipfs/QmafVJ8P5yNxzZmLxX3EY28vNwy1snYv7JHErCuTgmR5cs',
};

export const web3Exp = [
  'New to Crypto',
  'Occasionally contributing',
  'Contributing regularly',
];

export const workExp = [
  '0 Years',
  '<2 Years',
  '2 to 5 Years',
  '5 to 9 Years',
  '>9 Years',
];
export const workType = [
  'Not looking for Work',
  'Freelance',
  'Fulltime',
  'Internship',
];
