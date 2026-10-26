import type { Rewards } from '@/features/listings/types';

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
  // A personal project's.
  title: string;
  firstName: string;
  lastName: string;
  photo: string;
  username: string;
  listingId: number;
  sponsorId: number;
  listingTitle: string;
  rewards: Rewards | undefined;
  listingType: 'bounty' | 'hackathon';
  listingSlug: string;
  isWinnersAnnounced: boolean;
  token: string;
  sponsorName: string;
  sponsorLogo: string;
  sponsorSlug: string;
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
  isPrivate?: boolean;
}

const FEED_POST_TYPES = ['pow', 'grant-application', 'submission'] as const;

export type FeedPostType = (typeof FEED_POST_TYPES)[number];

export const parseFeedPostType = (
  value: string | null | undefined,
): FeedPostType | undefined => FEED_POST_TYPES.find((type) => type === value);

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// A feed post's id, as Earn's z.string().uuid() accepted it.
export const isFeedPostId = (value: string | null | undefined) =>
  !!value && UUID.test(value);

// The popular feed's period when a page first loads (Earn's default).
export const DEFAULT_TIME_PERIOD = 'This Month';
