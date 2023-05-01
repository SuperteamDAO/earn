import type { SponsorType } from '@/interface/sponsor';
import type { User } from '@/interface/user';

interface Eligibility {
  q1?: string;
  q2?: string;
  q3?: string;
}

interface Bounty {
  id: string;
  title: string;
  slug: string;
  description?: string;
  skills?: string;
  subSkills?: string;
  deadline?: string;
  eligibility?: Eligibility;
  status?: 'OPEN' | 'REVIEW' | 'CLOSED';
  isActive?: boolean;
  isPublished?: string;
  isFeatured?: string;
  token?: string;
  rewardAmount?: string;
  rewards?: string;
  sponsorId?: string;
  sponsor?: SponsorType;
  pocId?: string;
  poc?: User;
  source?: string;
  sourceDetails?: string;
}

export type { Bounty, Eligibility };
