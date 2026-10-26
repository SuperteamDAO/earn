import type { Skills } from '@/interface/skills';
// What the builder's pages get from the server (src/server/listing-builder.ts
// and listing-templates.ts): rows as Earn's API answered them, dates as
// ISO strings.
import type { BountyType, CompensationType, status } from '@/prisma/enums';

import type { Rewards } from '@/features/listings/types';

import type { TEligibilityQuestion } from './schema';

export interface BuilderHackathon {
  id: string;
  name: string;
  slug: string;
  logo: string;
  altLogo: string | null;
  startDate: string | null;
  deadline: string | null;
  eligibility: TEligibilityQuestion[] | null;
}

// A saved listing, as the edit and duplicate forms start from it.
export interface BuilderListing {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  deadline: string | null;
  commitmentDate: string | null;
  eligibility: TEligibilityQuestion[] | null;
  status: status;
  token: string | null;
  rewardAmount: number | null;
  rewards: Rewards | null;
  maxBonusSpots: number;
  sponsorId: string;
  pocSocials: string | null;
  skills: Skills | null;
  type: BountyType;
  region: string;
  templateId: string | null;
  hackathonId: string | null;
  isPublished: boolean;
  isFeatured: boolean;
  isPrivate: boolean;
  isFndnPaying: boolean;
  isWinnersAnnounced: boolean;
  publishedAt: string | null;
  compensationType: CompensationType;
  minRewardAsk: number | null;
  maxRewardAsk: number | null;
  referredBy: string | null;
  totalPaymentsMade: number;
  Hackathon: BuilderHackathon | null;
}

// One of Earn's listing templates, for the template picker.
export interface BuilderTemplate {
  id: string;
  title: string | null;
  description: string | null;
  skills: Skills | null;
  rewards: Rewards | null;
  rewardAmount: number | null;
  minRewardAsk: number | null;
  maxRewardAsk: number | null;
  maxBonusSpots: number | null;
  emoji: string | null;
  compensationType: CompensationType;
  type: BountyType;
  token: string | null;
  color: string | null;
  language: string | null;
  region: string;
  slug: string | null;
  Bounties: { sponsor: { name: string; logo: string | null } }[];
}

// What "Generate with AI" needs of a hackathon; the dashboard hands its own
// rows in.
export interface AutoGenerateHackathon {
  id: string;
  name: string;
  slug: string;
  startDate: string | Date | null;
  deadline: string | Date | null;
}
