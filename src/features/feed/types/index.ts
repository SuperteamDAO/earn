import { type Rewards } from '@/features/listings';
import { type PrizeListMap } from '@/interface/listings';

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
  rewards: Partial<typeof PrizeListMap> | undefined;
  listingType: string;
  listingSlug: string;
  isWinnersAnnounced: boolean;
  token: string;
  sponsorName: string;
  sponsorLogo: string;
  type: string;
  userId: string;
  likeCount: number;
  ogImage: string;
}
