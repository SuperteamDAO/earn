import { type WithdrawFormData } from '../utils/withdrawFormSchema';

export interface TxData extends WithdrawFormData {
  signature: string;
  timestamp: number;
  type: 'Credited' | 'Withdrawn';
}
