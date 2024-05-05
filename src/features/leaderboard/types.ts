export type Timeframe = 'this_year' | 'last_month' | 'last_quarter';
export type Status = 'overall_rankings' | 'content' | 'design' | 'others';

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
}
