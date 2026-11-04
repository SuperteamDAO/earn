import { type ScoutUserResponse } from '@/features/sponsor-dashboard/constants/scouts';

interface Scouts {
  id: string;
  userId: string;
  listingId: string;
  dollarsEarned: number;
  score: number;
  invited: boolean;
  skills: string[];
  createdAt: Date;
  user: ScoutUserResponse;
}

export type { Scouts };
