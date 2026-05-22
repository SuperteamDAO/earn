import type { SponsorType } from '@/interface/sponsor';
import type { UserSponsor } from '@/interface/userSponsor';
import type { EmailSettingsModel } from '@/prisma/models/EmailSettings';
import { type UserGetPayload, type UserSelect } from '@/prisma/models/User';

import type { PoW } from './pow';
import type { SubmissionWithUser } from './submission';

interface User {
  id?: string;
  walletAddress?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  username?: string;
  isVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
  role?: string;
  talent?: boolean;
  sponsor?: boolean;
  isTalentFilled?: boolean;
  bio?: string;
  location?: string;
  locationUpdatedAt?: string | Date | null;
  photo?: string;
  experience?: string;
  cryptoExperience?: string;
  currentEmployer?: string;
  community?: string;
  interests?: string;
  skills?: string;
  subSkills?: string;
  workPrefernce?: string;
  discord?: string;
  twitter?: string;
  github?: string;
  linkedin?: string;
  website?: string;
  telegram?: string;
  currentSponsorId?: string;
  peopleId?: string;
  currentSponsor?: SponsorType;
  people?: {
    id: string;
    chapterId?: string | null;
    type?: string | null;
    chapter?: {
      id: string;
      name: string;
      region: string;
      displayValue?: string | null;
      code?: string | null;
      countries?: unknown;
      icons?: string | null;
      sponsorId?: string | null;
    } | null;
  } | null;
  UserSponsors?: UserSponsor[];
  PoW?: PoW[];
  private?: boolean;
  Submission?: SubmissionWithUser[];
  hackathonId?: string;
  featureModalShown?: boolean;
  Hackathon?: {
    id: string;
    slug: string;
    name: string;
    logo: string;
    altLogo: string;
    description: string;
    sponsorId: string;
    startDate: string;
    deadline: string;
    announceDate: string;
  };
  surveysShown?: Record<string, boolean>;
  stRecommended?: boolean;
  acceptedTOS?: boolean;
  emailSettings?: EmailSettingsModel[];
  isBlocked?: boolean;
  isKYCVerified: boolean;
  linkedTwitter?: string[];
  referralCode?: string;
  referredById?: string | null;
  isPro?: boolean;
  isAgent?: boolean;
}

type PrismaUserWithoutKYC = UserGetPayload<{
  select: Omit<
    Record<keyof UserSelect, true>,
    | 'kycCountry'
    | 'kycAddress'
    | 'kycDOB'
    | 'kycIDNumber'
    | 'kycIDType'
    | 'kycName'
  >;
}>;

export type { PrismaUserWithoutKYC, User };
