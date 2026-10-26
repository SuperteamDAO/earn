import type { Skills } from '@/interface/skills';
import type { SponsorType } from '@/interface/sponsor';
import { type User } from '@/interface/user';
import { type BountyType, type status } from '@/prisma/enums';

import { type ListingContext } from '../hooks/useListings';

export interface Listing {
  id?: string;
  title?: string;
  slug?: string;
  description?: string;
  requirements?: string;
  applicationLink?: string;
  skills?: Skills;
  deadline?: string;
  commitmentDate?: string;
  eligibility?: Eligibility[];
  status?: status;
  isActive?: boolean;
  isArchived?: boolean;
  isPublished?: boolean;
  isFeatured?: boolean;
  token?: string;
  rewardAmount?: number;
  rewards?: Rewards;
  maxBonusSpots?: number;
  sponsorId?: string;
  sponsor?: SponsorType;
  pocSocials?: string;
  pocId?: string;
  poc?: User;
  source?: string;
  type?: BountyType | 'grant';
  applicationType?: 'fixed';
  totalWinnersSelected?: number;
  region?: string;
  totalPaymentsMade?: number;
  isWinnersAnnounced?: boolean;
  templateId?: string;
  hackathonprize?: boolean;
  publishedAt?: string;
  isPrivate?: boolean;
  Hackathon?: ListingHackathon;
  compensationType?: 'fixed' | 'range' | 'variable';
  minRewardAsk?: number;
  maxRewardAsk?: number;
  winnersAnnouncedAt?: string;
  hackathonId?: string;
  _count?: {
    Comments?: number;
  };
  isFndnPaying?: boolean;
  usdValue?: number;
  referredBy?: string;
}

/**
 * Listing data that is safe to expose on the public listing details route.
 * The API route enforces this boundary with an explicit Prisma select.
 */
export type PublicListing = Listing;

type PublicListingDetailsFields =
  | 'id'
  | 'title'
  | 'slug'
  | 'description'
  | 'deadline'
  | 'commitmentDate'
  | 'eligibility'
  | 'status'
  | 'token'
  | 'rewardAmount'
  | 'rewards'
  | 'maxBonusSpots'
  | 'sponsorId'
  | 'sponsor'
  | 'poc'
  | 'isPublished'
  | 'skills'
  | 'type'
  | 'requirements'
  | 'isWinnersAnnounced'
  | 'region'
  | 'pocSocials'
  | 'publishedAt'
  | 'isPrivate'
  | 'hackathonId'
  | 'compensationType'
  | 'maxRewardAsk'
  | 'minRewardAsk'
  | 'isFndnPaying'
  | 'winnersAnnouncedAt'
  | 'Hackathon';

export type PublicListingDetails = Omit<
  Pick<PublicListing, PublicListingDetailsFields>,
  'id' | 'title' | 'slug'
> & {
  id: string;
  title: string;
  slug: string;
};

export interface SubmissionMutationResponse {
  success: true;
  submissionId: string;
}

export interface ListingHackathon {
  name: string;
  logo: string;
  description: string;
  deadline: string;
  startDate: string;
  altLogo: string;
  slug: string;
  announceDate: string;
  Sponsor: SponsorType;
}

export interface ListingWithSubmissions extends Listing {
  _count?: {
    Submission?: number;
    Comments?: number;
  };
  submissionCount?: number;
}

interface Eligibility {
  order: number;
  question: string;
  type?: 'text' | 'link';
  optional?: boolean;
  isLink?: boolean;
}

export interface References {
  order: number;
  link?: string;
  title?: string;
}

export interface Rewards {
  [rank: number]: number;
}

export interface ListingTabsProps {
  type: ListingContext;
  potentialSession?: boolean;
  region?: string;
  sponsor?: string;
  category?: string;
  defaultTab?: 'bounties' | 'projects';
}
