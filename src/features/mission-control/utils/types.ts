export type TIMEFRAME = 'yearToDate' | 'last30days' | 'last7days' | 'allTime';
export type TSXTYPE = 'all' | 'grants' | 'st-earn' | 'miscellaneous';

export type STATUS = 'all' | 'pending' | 'processing' | 'paid' | 'rejected';

export type PaymentData = {
  id: string;
  title: string;
  name: string;
  type: TSXTYPE;
  date: Date;
  amount: number;
  tokenSymbol: string;
  status: STATUS;
  kycLink: string;
  email: string;
  walletAddress: string;
  discordId: string;
};
