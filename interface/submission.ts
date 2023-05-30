// import type { Prisma } from '@prisma/client';

// type SubmissionWithUser = Prisma.SubmissionGetPayload<{
//   include: {
//     user: true;
//   };
// }>;
// export type { SubmissionWithUser };

import type { ListingType, User } from '@prisma/client';

interface SubmissionWithUser {
  id: string;
  link?: string;
  tweet?: string;
  eligibilityAnswers?: any;
  userId: string;
  listingType: ListingType;
  listingId: string;
  isWinner: boolean;
  winnerPosition?: string | null;
  isActive: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  like?: any;
  likes?: number;
  user: User;
}

export type { SubmissionWithUser };
