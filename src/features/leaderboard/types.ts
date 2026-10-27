import {
  type TalentRankingSkills,
  type TalentRankingTimeframe,
} from '@/prisma/enums';

export type TIMEFRAME = TalentRankingTimeframe;
export type SKILL = TalentRankingSkills;

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
  location?: string | null;
}
