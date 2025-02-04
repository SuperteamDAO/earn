export interface TokenActivity {
  type: 'Credited' | 'Withdrawn';
  amount: number;
  usdValue: number;
  counterpartyAddress: string;
  tokenAddress: string;
  tokenSymbol: string;
  tokenImg: string;
  timestamp: number;
  signature: string;
}
