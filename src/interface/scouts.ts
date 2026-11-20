import { type ScoutUserResponse } from '@/features/sponsor-dashboard/constants/scouts';

interface Scouts {
  id: string;
  userId: string;
  listingId: string;
  dollarsEarned: number;
  // Prisma Decimal, which serializes to a string such as "8.53".
  score: string;
  invited: boolean;
  skills: string[];
  createdAt: string;
  user: ScoutUserResponse;
}

export type { Scouts };
