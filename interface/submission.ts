import type { ListingType } from '@prisma/client';

import type { User } from '@/interface/user';

interface SubmissionWithUser {
  id?: string;
  link?: string;
  tweet?: string;
  eligibilityAnswers?: any;
  userId?: string;
  listingType?: ListingType;
  listingId?: string;
  isWinner?: boolean;
  winnerPosition?: string;
  isActive?: boolean;
  isArchived?: boolean;
  createdAt?: string;
  updatedAt?: string;
  like?: any;
  likes?: number;
  user?: User;
}

export type { SubmissionWithUser };
