export interface TokenAsset {
  tokenAddress: string;
  tokenSymbol: string;
  tokenImg: string;
  amount: number;
  usdValue: number;
  tokenName: string;
  // The mint's decimals, for the withdraw form and its setup fee.
  decimals: number;
}
