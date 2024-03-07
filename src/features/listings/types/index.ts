import type { BountyType, Regions } from '@prisma/client';
import type { User } from 'next-auth';

import type { SuperteamName } from '@/features/listing-builder';
import type { Skills } from '@/interface/skills';
import type { SponsorType } from '@/interface/sponsor';

export interface Bounty {
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
  status?: 'OPEN' | 'REVIEW' | 'CLOSED';
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
    altLogo: string;
    slug: string;
    announceDate: string;
  };
  compensationType?: 'fixed' | 'range' | 'variable';
  minRewardAsk?: number;
  maxRewardAsk?: number;
}

export interface BountyWithSubmissions extends Bounty {
  _count?: {
    Submission?: number;
  };
}

interface Eligibility {
  order: number;
  question: string;
  type?: 'text';
}

export interface References {
  order: number;
  link: string;
}

export interface Rewards {
  first?: number;
  second?: number;
  third?: number;
  fourth?: number;
  fifth?: number;
}
