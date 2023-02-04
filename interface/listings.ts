import { Prize, Source, SponsorStatus } from './types';

type PrizeList = {
  [key in Prize]: string;
};
interface Bounties {
  id: string;
  title: string;
  description: string;
  skills: string;
  deadline: string;
  source: Source;
  completeTime: string;
  amount: string;
  token: string;
  sponsorStatus: SponsorStatus;
  active: boolean;
  tx: string;
  private: boolean;
  featured: boolean;
  industry: string;
  escrow: boolean;
  prizeList: Partial<PrizeList>; // change to enum and string
  claimLink: string;
  bugBounty: string;
  orgId: string;
  winner: Winner[];
}
interface Winner {
  id: string;
  email: string;
  name: string;
  publickey: string;
  bountiesId: string;
  prize: Prize;
}
export type { Bounties, Winner };
