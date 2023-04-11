import type { SponsorTypes } from './types';

interface SponsorType {
  id?: string;
  orgId?: string;
  publickey: string;
  name: string;
  logo: string;
  url: string;
  industry: string;
  twitter: string;
  bio: string;
  verified: boolean;
  type: SponsorTypes;
  email: string;
  username: string;
}
export type { SponsorType };
