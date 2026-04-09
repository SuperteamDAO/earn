export interface RewardTokenLike {
  tokenName: string;
  tokenSymbol: string;
  mintAddress: string;
  icon: string;
  decimals: number;
  sortOrder?: number;
  isActive?: boolean;
}

export const IN_KIND_REWARD_SYMBOL = 'IN_KIND';
export const IN_KIND_REWARD_LABEL = 'In-kind';
export const IN_KIND_REWARD_OPTION_LABEL =
  'In-kind rewards (share details in the description)';
export const IN_KIND_REWARD_ICON = '/assets/dollar.svg';

export const IN_KIND_REWARD_TOKEN: RewardTokenLike = {
  tokenName: IN_KIND_REWARD_LABEL,
  tokenSymbol: IN_KIND_REWARD_SYMBOL,
  mintAddress: IN_KIND_REWARD_SYMBOL,
  icon: IN_KIND_REWARD_ICON,
  decimals: 0,
  sortOrder: Number.MAX_SAFE_INTEGER,
  isActive: true,
};

export const isInKindReward = (token?: string | null) =>
  token === IN_KIND_REWARD_SYMBOL;

export const getRewardTokenDisplayName = (token?: string | null) =>
  isInKindReward(token) ? IN_KIND_REWARD_LABEL : (token ?? '');
