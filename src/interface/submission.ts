import { type SubmissionLabels, type SubmissionStatus } from '@prisma/client';

import type { Listing, Rewards } from '@/features/listings/types';

import { type User } from './user';

interface SubmissionWithUser {
  id: string;
  sequentialId: number;
  status: SubmissionStatus;
  link?: string;
  tweet?: string;
  otherInfo?: string;
  otherTokenDetails?: string;
  eligibilityAnswers?: any;
  userId: string;
  listingId: string;
  isWinner: boolean;
  winnerPosition?: keyof Rewards;
  isPaid: boolean;
  paymentDetails?: {
    txId?: string;
  };
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
  token?: string;
}

export type { SubmissionWithUser };
