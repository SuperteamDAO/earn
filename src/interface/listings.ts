import type { SponsorType } from './sponsor';
import type { Talent } from './talent';

type SponsorStatus = 'Unassigned' | 'Assigned';
type Source = 'native' | 'manual';
type Prize = 'first' | 'second' | 'third' | 'fourth' | 'fifth';

type PrizeListType = {
  [key in Prize]: string;
};
export const PrizeListMap = {
  first: 'First prize',
  second: 'Second prize',
  third: 'Third prize',
  fourth: 'Fourth prize',
  fifth: 'Fifth prize',
};

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
  prizeList: Partial<PrizeListType>; // change to enum and string
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
  rewards?: Partial<PrizeListType>;
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
  prize: Prize;
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
