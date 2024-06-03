import { type GrantApplication, type User } from '@prisma/client';

export type ScoutRowType = {
  id: string;
  name: string;
  pfp: string | null;
  username: string | null;
  dollarsEarned: number;
  score: number;
  skills: string[];
  recommended: boolean;
  invited: boolean;
  userId: string;
};

export interface GrantApplicationWithUser extends GrantApplication {
  user: User;
}

export interface SponsorStats {
  name?: string;
  logo?: string;
  yearOnPlatform?: number;
  totalRewardAmount?: number;
  totalListingsAndGrants?: number;
  totalSubmissionsAndApplications?: number;
}
