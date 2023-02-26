import { Prize, Source, SponsorStatus } from './types';

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
  completeTime: string;
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
}
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
  type: string;
  link: string;
  deadline: string;
}

type Experience =
  | '0 Yrs: Fresher/Graduate '
  | '0-1 Yrs: Some Experience Required'
  | '1-5 Yrs: Early Career Professional'
  | '5-10 Yrs: Mid Career Professional'
  | '10 Yrs+: Senior Professional';

export type { Bounties, Winner, PrizeListType, JobBasicsType, Experience };
