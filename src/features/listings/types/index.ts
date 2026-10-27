import type { Skills } from '@/interface/skills';
import type { SponsorType } from '@/interface/sponsor';
import { type User } from '@/interface/user';
import {
  type BountyType,
  type status,
  type SubmissionLabels,
  type AgentAccess,
  type CompensationType,
  type Source,
  type ApplicationType,
} from '@/prisma/enums';

import { type ListingContext } from '../hooks/useListings';

export interface Listing {
  id?: string;
  title?: string;
  slug?: string;
  description?: string | null;
  requirements?: string | null;
  applicationLink?: string | null;
  skills?: Skills;
  deadline?: string;
  commitmentDate?: string;
  eligibility?: Eligibility[];
  status?: status;
  isActive?: boolean;
  isArchived?: boolean;
  isPublished?: boolean;
  isFeatured?: boolean;
  token?: string | null;
  rewardAmount?: number | null;
  rewards?: Rewards;
  maxBonusSpots?: number;
  sponsorId?: string;
  sponsor?: SponsorType;
  pocSocials?: string | null;
  pocId?: string;
  poc?: User;
  source?: Source;
  type?: BountyType | 'grant';
  applicationType?: ApplicationType;
  totalWinnersSelected?: number;
  region?: string;
  totalPaymentsMade?: number;
  isWinnersAnnounced?: boolean;
  templateId?: string | null;
  hackathonprize?: boolean;
  publishedAt?: string;
  isPrivate?: boolean;
  isPro?: boolean;
  agentAccess?: AgentAccess;
  Hackathon?: ListingHackathon;
  compensationType?: CompensationType;
  minRewardAsk?: number | null;
  maxRewardAsk?: number | null;
  winnersAnnouncedAt?: string;
  hackathonId?: string | null;
  _count?: {
    Comments?: number;
  };
  isFndnPaying?: boolean;
  usdValue?: number | null;
  referredBy?: string | null;
  ai?: ProjectAi | BountiesAi;
}

/**
 * Listing data that is safe to expose on the public listing details route.
 *
 * Keep internal review configuration out of this contract. The API route also
 * enforces this boundary with an explicit Prisma select.
 */
export type PublicListing = Omit<Listing, 'ai'>;

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
  | 'agentAccess'
  | 'hackathonId'
  | 'compensationType'
  | 'maxRewardAsk'
  | 'minRewardAsk'
  | 'isFndnPaying'
  | 'winnersAnnouncedAt'
  | 'isPro'
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
  deadline: string | null;
  startDate: string | null;
  altLogo: string | null;
  slug: string;
  announceDate: string | null;
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
  skill?: string;
  category?: string;
  defaultTab?: 'bounties' | 'projects';
}

type ProjectContextQuestionsType = {
  type: 'pow' | 'qualitative' | 'yesno' | 'contact';
  question: string;
  order: number;
}[];

type ProjectContextSummary = {
  projectSummary: string;
  skills: string;
  responsibilities: string;
  experience: string;
  companyInfo: string;
};

interface ProjectAi {
  context?: {
    summary?: ProjectContextSummary;
    questionTypes?: ProjectContextQuestionsType;
  };
}

type ProjectApplicationEvaluation = {
  predictedLabel?: SubmissionLabels;
  shortNote?: string;
  scores?: Scores;
};

export interface ProjectApplicationAi {
  review?: ProjectApplicationEvaluation;
  commited?: boolean;
}

type Scores = {
  skills: number;
  experience: number;
  application: number;
};
export interface BountySubmissionAi {
  analytics?: TwitterAnalytics;
  invalidTwitterLink?: boolean;
  evaluation?: BountySubmissionEvaluation;
  commited?: boolean;
}

type BountySubmissionEvaluation = {
  finalLabel?: SubmissionLabels;
  notes?: string;
  criteriaScore?: number;
  qualityScore?: number;
  totalScore?: number;
};

type TwitterAnalytics = {
  totalViews: number;
  totalLikes: number;
  totalRetweets: number;
  totalReplies: number;
  totalBookmarks: number;
  lastSynced: string;
};
export interface BountiesAi {
  analytics?: TwitterAnalytics;
  invalidTwitterLinkCount?: number;
  context?: {
    criterias?: JudgingCriterias['criterias'];
    checks?: Checks;
    summary?: string;
    category?: Category;
  };
  evaluationCompleted?: boolean;
}

type Category = 'tweet' | 'feedback' | 'blog' | 'other';
type Checks = {
  tweets_shouldTag: string[];
  language?: string | null | undefined;
  template?: string | null | undefined;
  tweets_minimum?: number | null | undefined;
  tweets_maximum?: number | null | undefined;
};
type JudgingCriterias = {
  criterias: {
    criterion: string;
    weightage: number;
  }[];
};
