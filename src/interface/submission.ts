import { type SubmissionLabels, type SubmissionStatus } from '@prisma/client';

import type { Listing, Rewards } from '@/features/listings';

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
}

export type { SubmissionWithUser };
