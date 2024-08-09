import { type Rewards } from '@/features/listings';

import type { SponsorType } from './sponsor';
import type { Talent } from './talent';

type SponsorStatus = 'Unassigned' | 'Assigned';
type Source = 'native' | 'manual';

interface Questions {
  id: string;
  bountiesId: string;
  questions: string;
}

interface Bounties {
  id?: string;
  title: string;
  description: string;
  skills: string;
  subSkills: string;
  deadline: string;
  source: Source;
  amount: string;
  token: string;
  sponsorStatus: SponsorStatus;
  active: boolean;
  privateBool: boolean;
  featured: boolean;
  prizeList: Rewards;
  bugBounty: boolean;
  orgId: string;
  showTop: boolean;
  eligibility: string;
  status: BountyStatus;
  slug: string;
  winner?: Winner[];
  submission?: SubmissionType[];
  subscribe?: SubscribeType[];
  Questions?: Questions;
  sponsor?: SponsorType;
  rewards?: Rewards;
  isWinnersAnnounced?: boolean;
  type?: 'bounty' | 'project' | 'hackathon';
}

type BountyStatus = 'open' | 'review' | 'close';
interface Winner {
  id: string;
  email: string;
  name: string;
  publickey: string;
  bountiesId: string;
  prize: number;
}

interface SubmissionType {
  id: string;
  image: string;
  likes: string;
  link: string;
  talent: string;
  questions: string;
  bountiesId: string;
  Talent?: Talent;
}

interface SubscribeType {
  id?: string;
  talentId: string;
  bountiesId: string;
  Talent?: Talent;
}

export type { Bounties };
