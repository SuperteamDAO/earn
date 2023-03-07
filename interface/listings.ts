import { JobType, Listingtype, Prize, Source, SponsorStatus } from './types';

type PrizeListType = {
  [key in Prize]: string;
};
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
  winner?: Winner[];
  showTop: boolean;
  eligibility: string;
  status: BountyStatus;
  slug: string;
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
  source: Source;
  title: string;
  subskills: string;
  id: string;
  timezone: string;
}

interface GrantsBasicType {
  title: string;
  contact: string;
}
interface GrantsType {
  id: string;
  title: string;
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
  id: string;
  orgId: string;
  type: Listingtype;
  basic: string;
  payments: string;
}

export type {
  Bounties,
  Winner,
  PrizeListType,
  JobsType,
  JobBasicsType,
  Experience,
  GrantsType,
  GrantsBasicType,
  DraftType,
};
