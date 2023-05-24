import type { SkillsProp } from '@/interface/skills';

import type { Talent } from './talent';
import type {
  JobType,
  Listingtype,
  Prize,
  Source,
  SponsorStatus,
} from './types';

type PrizeListType = {
  [key in Prize]: string;
};
export const PrizeListMap = {
  first: 'First prize',
  second: 'Second prize',
  third: 'Third prize',
  forth: 'Forth prize',
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
interface JobBasicsType {
  title: string;
  type: JobType;
  link: string;
  deadline: string;
}
interface JobsType {
  active: boolean;
  deadline: string;
  description: string;
  experience: string;
  featured: boolean;
  jobType: JobType;
  location: string;
  maxEq: number;
  maxSalary: number;
  minEq: number;
  minSalary: number;
  orgId: string;
  skills: string;
  link: string;
  source: Source;
  title: string;
  subskills: string;
  id: string;
  timezone: string;
}

interface GrantsBasicType {
  title: string;
  contact: string;
  link: string;
}
interface GrantsType {
  id: string;
  title: string;
  link: string;
  description: string;
  skills: string;
  subSkills: String;
  source: Source;
  contact: string;
  token: string;
  active: boolean;
  orgId: string;
  maxSalary: number;
  minSalary: number;
}
type Experience =
  | '0 Yrs: Fresher/Graduate '
  | '0-1 Yrs: Some Experience Required'
  | '1-5 Yrs: Early Career Professional'
  | '5-10 Yrs: Mid Career Professional'
  | '10 Yrs+: Senior Professional';

interface DraftType {
  id?: string;
  sponsorId?: string;
  type?: Listingtype;
  skills?: SkillsProp[];
  basic?: string;
  payments?: string;
  question?: string;
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

export type {
  Bounties,
  DraftType,
  Experience,
  GrantsBasicType,
  GrantsType,
  JobBasicsType,
  JobsType,
  PrizeListType,
  SubmissionType,
  SubscribeType,
  Winner,
};
