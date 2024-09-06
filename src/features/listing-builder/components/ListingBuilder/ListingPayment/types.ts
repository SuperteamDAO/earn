import { type Rewards } from '@/features/listings';

export interface Token {
  tokenName: string;
  tokenSymbol: string;
  mintAddress: string;
  icon: string;
  decimals: number;
  coingeckoSymbol: string;
}

export interface PrizeListInterface {
  value: number;
  label: string;
  placeHolder: number;
  defaultValue?: number;
}

export interface FormType {
  compensationType: 'fixed' | 'range' | 'variable' | undefined;
  rewardAmount: number | undefined;
  minRewardAsk: number | undefined;
  maxRewardAsk: number | undefined;
  token: string | undefined;
  rewards: Rewards | undefined;
  maxBonusSpots: number | undefined;
}
