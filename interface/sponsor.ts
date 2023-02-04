import { sponsorType } from './types';

interface SponsorType {
  id: string;
  orgId: string;
  publickey: string;
  name: string;
  logo: string;
  url: string;
  industry: string;
  twitter: string;
  bio: string;
  verified: boolean;
  type: sponsorType;
  email: string;
}
export type { SponsorType };
