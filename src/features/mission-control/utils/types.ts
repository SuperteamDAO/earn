export type TIMEFRAME = 'yearToDate' | 'last30days' | 'last7days' | 'allTime';
export type TSXTYPE = 'all' | 'grants' | 'st-earn' | 'miscellaneous';

export type STATUS = 'all' | 'accepted' | 'rejected' | 'undecided';

export type SYNC_SOURCE = 'All Grants' | 'Misc Payments' | 'Earn All_Sync';

export type PaymentData = {
  id: string;
  title: string | null;
  name: string | null;
  type: TSXTYPE | null;
  date: Date | null;
  amount: number | null;
  tokenSymbol: string | null;
  status: STATUS | null;
  kycLink: string | null;
  email: string | null;
  walletAddress: string | null;
  discordId: string | null;
  region: string | null;
  recordId: string | null;
  earnId: string | null;
};

export interface SuperteamOption {
  value: string;
  label: string;
  superteam: {
    name: string;
    logo: string;
  };
}
export type AIRTABLE_STATUS =
  | 'Rejected'
  | 'Accepted'
  | 'Undecided'
  | 'Applied'
  | 'Verified'
  | 'Sent to pipeline';

export type ButtonSize = 'small' | 'normal';
