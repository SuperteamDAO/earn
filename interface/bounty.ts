import type { BountyType, Regions } from '@prisma/client';

import type { QuestionType } from '@/components/listings/bounty/questions/builder';
import type { SponsorType } from '@/interface/sponsor';
import type { User } from '@/interface/user';

import type { Skills } from './skills';

interface Eligibility {
  order: number;
  question: string;
  type?: QuestionType;
}

interface Rewards {
  first?: number;
  second?: number;
  third?: number;
  fourth?: number;
  fifth?: number;
}

type BountyStatus = 'OPEN' | 'REVIEW' | 'CLOSED';

interface Bounty {
  id?: string;
  title?: string;
  slug?: string;
  description?: string;
  requirements?: string;
  applicationLink?: string;
  skills?: Skills;
  deadline?: string;
  eligibility?: Eligibility[];
  status?: BountyStatus;
  isActive?: boolean;
  isArchived?: boolean;
  isPublished?: boolean;
  isFeatured?: boolean;
  token?: string;
  rewardAmount?: number;
  rewards?: Rewards;
  sponsorId?: string;
  sponsor?: SponsorType;
  pocSocials?: string;
  pocId?: string;
  poc?: User;
  source?: string;
  sourceDetails?: string;
  type?: BountyType | string;
  totalWinnersSelected?: number;
  region?: Regions;
  totalPaymentsMade?: number;
  isWinnersAnnounced?: boolean;
  templateId?: string;
  hackathonprize?: boolean;
}

interface BountyWithSubmissions extends Bounty {
  _count?: {
    Submission?: number;
  };
}

export type {
  Bounty,
  BountyStatus,
  BountyWithSubmissions,
  Eligibility,
  Rewards,
};
