import { type SubmissionLabels, type SubmissionStatus } from '@/prisma/enums';

import type {
  Listing,
  ProjectApplicationAi,
  Rewards,
} from '@/features/listings/types';

import { type User } from './user';

interface SubmissionWithUser {
  id: string;
  status: SubmissionStatus;
  link?: string;
  tweet?: string;
  otherInfo?: string;
  eligibilityAnswers?: any;
  userId: string;
  listingId: string;
  isWinner: boolean;
  winnerPosition?: keyof Rewards;
  isPaid: boolean;
  paymentDetails?: Array<{
    txId: string;
    amount: number;
    tranche: number;
  }>;
  rewardInUSD: number;
  isActive: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  like?: any;
  user: User;
  listing?: Listing;
  ask?: number;
  label: SubmissionLabels;
  notes?: string;
  totalEarnings?: number;
  ai?: ProjectApplicationAi;
}

export type { SubmissionWithUser };
