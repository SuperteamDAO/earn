import { type Regions } from '@prisma/client';

import { type References, type Rewards } from '@/features/listings';

import { type Ques } from '../components/ListingBuilder';

export * from './SuperteamName';

export interface ListingFormType {
  id?: string;
  title?: string;
  slug?: string;
  deadline?: string;
  templateId?: string;
  pocSocials?: string;
  applicationType?: 'fixed' | 'rolling';
  timeToComplete?: string;
  type?: 'bounty' | 'hackathon' | 'project';
  region?: Regions;
  referredBy?: string;
  requirements?: string;
  eligibility?: Ques[];
  references?: References[];
  isPrivate?: boolean;
  skills?: any;
  description?: any;
  publishedAt?: string;
  rewardAmount?: number;
  rewards?: Rewards;
  token?: string;
  compensationType?: 'fixed' | 'range' | 'variable' | undefined;
  minRewardAsk?: number;
  maxRewardAsk?: number;
}

export interface ListingStoreType {
  form: ListingFormType;
  updateState: (data: Partial<ListingFormType>) => void;
  resetForm: () => void;
}
