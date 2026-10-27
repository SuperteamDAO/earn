import { type SubmissionSelect } from '@/prisma/models/Submission';

export const homeFeedSelect = {
  createdAt: true,
  isWinner: true,
  listing: { select: { type: true, isWinnersAnnounced: true } },
  user: { select: { firstName: true, lastName: true, username: true } },
} satisfies SubmissionSelect;
