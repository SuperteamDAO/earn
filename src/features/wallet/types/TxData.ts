import type { WithdrawFormData } from '../utils/withdrawal';

// A withdrawal just made, or an activity row opened.
export interface TxData extends WithdrawFormData {
  signature: string;
  timestamp: number;
  type: 'Credited' | 'Withdrawn';
  tokenSymbol: string;
  tokenImg: string;
}
