import type { BountyType, Regions } from '@prisma/client';

import type { QuestionType } from '@/components/listings/bounty/questions/builder';
import type { Superteams } from '@/constants/Superteam';
import type { SponsorType } from '@/interface/sponsor';
import type { User } from '@/interface/user';

import type { Skills } from './skills';

interface Eligibility {
  order: number;
  question: string;
  type?: QuestionType;
}

interface References {
  order: number;
  link: string;
}

interface Rewards {
  first?: number;
  second?: number;
  third?: number;
  fourth?: number;
  fifth?: number;
}

type BountyStatus = 'OPEN' | 'REVIEW' | 'CLOSED';
export type SuperteamName = (typeof Superteams)[number]['name'];

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
  references?: References[];
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
  applicationType?: 'fixed' | 'rolling';
  totalWinnersSelected?: number;
  region?: Regions;
  totalPaymentsMade?: number;
  isWinnersAnnounced?: boolean;
  templateId?: string;
  timeToComplete?: string;
  hackathonprize?: boolean;
  referredBy?: SuperteamName;
  publishedAt?: string;
  isPrivate?: boolean;
  Hackathon?: {
    name: string;
    logo: string;
    description: string;
    deadline: string;
    startDate: string;
  };
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
  References,
  Rewards,
};
