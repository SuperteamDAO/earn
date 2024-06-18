export type TIMEFRAME =
  | 'THIS_YEAR'
  | 'LAST_30_DAYS'
  | 'LAST_7_DAYS'
  | 'ALL_TIME';
export type SKILL = 'ALL' | 'CONTENT' | 'DESIGN' | 'DEVELOPMENT' | 'OTHER';

export interface RowType {
  rank: number;
  name: string;
  pfp: string | null;
  username: string | null;
  dollarsEarned: number;
  submissions: number;
  wins: number;
  winRate: number;
  skills: string[];
  location?: string;
}
