import { Experience } from '../interface/listings';

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
    tokenName: 'Solana (SOL)',
    mintAddress: 'sadfasdf', // need to change it
    address: 'dsafasdf', // need to change
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/16116.png',
  },
  {
    tokenName: 'USD Coin',
    mintAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3408.png',
  },
  {
    tokenName: 'USDT',
    mintAddress: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/825.png',
  },
  {
    tokenName: 'mSOL',
    mintAddress: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
    address: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/11461.png',
  },
  {
    tokenName: 'UXD Stablecoin (UXD)',
    mintAddress: '7kbnvuGBxxj8AG9qp8Scn56muWGaRaFqxg1FsRp3PaFT',
    address: '7kbnvuGBxxj8AG9qp8Scn56muWGaRaFqxg1FsRp3PaFT',
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/17535.png',
  },
  {
    tokenName: 'Raydium (RAY)',
    mintAddress: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
    address: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/8526.png',
  },
  {
    tokenName: 'Saber (SBR)',
    mintAddress: 'Saber2gLauYim4Mvftnrasomsv6NvAuncvMEZwcLpD1',
    address: 'Saber2gLauYim4Mvftnrasomsv6NvAuncvMEZwcLpD1',
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/11181.png',
  },
  {
    tokenName: 'Solend (SLND)',
    mintAddress: 'SLNDpmoWTVADgEdndyvWzroNL7zSi1dF9PC3xHGtPwp',
    address: 'SLNDpmoWTVADgEdndyvWzroNL7zSi1dF9PC3xHGtPwp',
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/13524.png',
  },
  {
    tokenName: 'Coin98 (C98)',
    mintAddress: 'C98A4nkJXhpVZNAZdHUA95RpTF3T4whtQubL3YobiUX9',
    address: 'C98A4nkJXhpVZNAZdHUA95RpTF3T4whtQubL3YobiUX9',
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/10903.png',
  },
  {
    tokenName: 'Serum (SRM)',
    mintAddress: 'SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt',
    address: 'SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt',
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/6187.png',
  },
  {
    tokenName: 'DUST Protocol (DUST)',
    mintAddress: 'DUSTawucrTsGU8hcqRdHDCbuYhCPADMLM2VcCb8VnFnQ',
    address: 'DUSTawucrTsGU8hcqRdHDCbuYhCPADMLM2VcCb8VnFnQ',
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/18802.png',
  },
  {
    tokenName: 'wrapped Solana (wSOL)',
    mintAddress: 'So11111111111111111111111111111111111111112',
    address: 'So11111111111111111111111111111111111111112',
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/16116.png',
  },
  {
    tokenName: 'Bonfida (FIDA)',
    mintAddress: 'EchesyfXePKdLtoiZSL8pBe8Myagyy8ZRqsACNCFGnvp',
    address: 'EchesyfXePKdLtoiZSL8pBe8Myagyy8ZRqsACNCFGnvp',
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/7978.png',
  },
  {
    tokenName: 'Orca (ORCA)',
    mintAddress: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE',
    address: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE',
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/11165.png',
  },
];
export const MainSkills: MultiSelectOptions[] = [
  {
    label: 'Front-End Dev',
    value: 'Front-End-Dev',
  },
  {
    label: 'Back-End Dev',
    value: 'Back-End-Dev',
  },
  {
    label: 'Blockchain Dev',
    value: 'Blockchain-Dev',
  },
  {
    label: 'Fullstack Dev',
    value: 'Fullstack-Dev',
  },
  {
    label: 'Mobile Engineer',
    value: 'Mobile-Engineer',
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
export const ExperienceList: Experience[] = [
  '0 Yrs: Fresher/Graduate ',
  '0-1 Yrs: Some Experience Required',
  '1-5 Yrs: Early Career Professional',
  '5-10 Yrs: Mid Career Professional',
  '10 Yrs+: Senior Professional',
];
export const PrizeList = ['First', 'Second', 'Third', 'Forth', 'Fifth'];
