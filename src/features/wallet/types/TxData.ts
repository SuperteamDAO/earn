import { type WithdrawFormData } from '../utils/withdrawFormSchema';

export interface TxData extends Omit<WithdrawFormData, 'recipientAddress'> {
  signature: string;
  timestamp: number;
  type: 'Credited' | 'Withdrawn';
  recipientAddress: string;
}
