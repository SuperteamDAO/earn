import { type SubmissionLabels, type SubmissionStatus } from '@/prisma/enums';
import { type QuestionAnswer } from '@/utils/parseQuestionAnswers';

import { type FeedDataProps } from '@/features/feed/types';
import type {
  Listing,
  ProjectApplicationAi,
  Rewards,
} from '@/features/listings/types';

import { type User } from './user';

interface SubmissionWithUser {
  id: string;
  status: SubmissionStatus;
  link?: string | null;
  tweet?: string | null;
  otherInfo?: string | null;
  eligibilityAnswers?: QuestionAnswer[];
  userId: string;
  agentId?: string | null;
  listingId: string;
  isWinner: boolean;
  winnerPosition?: keyof Rewards | null;
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
  like?: FeedDataProps['like'];
  user: User;
  listing?: Listing;
  ask?: number | null;
  telegram?: string | null;
  label: SubmissionLabels;
  notes?: string | null;
  totalEarnings?: number;
  ai?: ProjectApplicationAi;
}

interface ListingWinner {
  id: string;
  winnerPosition: number | null;
  user: {
    id: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    photo: string | null;
  };
}

interface ListingPageSubmission {
  id: string;
  link?: string;
  isWinner: boolean;
  winnerPosition?: keyof Rewards;
  like?: unknown;
  user: Pick<User, 'firstName' | 'lastName' | 'photo' | 'username'> & {
    id: string;
  };
}

export type { ListingPageSubmission, ListingWinner, SubmissionWithUser };
