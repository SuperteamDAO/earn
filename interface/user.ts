import type { SponsorType } from './sponsor';

interface User {
  id: string;
  publickey: string;
  talent: boolean;
  sponsor: boolean;
  sponsors?: SponsorType[];
}
export type { User };
