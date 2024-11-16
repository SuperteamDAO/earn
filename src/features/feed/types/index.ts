import { z } from 'zod';

import { type Rewards } from '@/features/listings';

export interface FeedDataProps {
  id: string;
  createdAt: string;
  like: {
    id: string | undefined;
    date: number;
  }[];
  link: string;
  tweet: string;
  eligibilityAnswers: string;
  otherInfo: string;
  isWinner: boolean;
  winnerPosition: keyof Rewards | undefined;
  description: string;
  firstName: string;
  lastName: string;
  photo: string;
  username: string;
  listingId: number;
  sponsorId: number;
  listingTitle: string;
  rewards: Rewards | undefined;
  listingType: 'bounty' | 'hackathon' | 'project';
  listingSlug: string;
  isWinnersAnnounced: boolean;
  token: string;
  sponsorName: string;
  sponsorLogo: string;
  type: FeedPostType;
  userId: string;
  likeCount: number;
  ogImage: string;
  grantApplicationAmount: number;
  commentCount: number;
  recentCommenters: {
    author: {
      photo: string | null;
      name: string | null;
    };
  }[];
}

export const FeedPostTypeSchema = z.enum([
  'pow',
  'grant-application',
  'submission',
]);

export type FeedPostType = z.infer<typeof FeedPostTypeSchema>;
