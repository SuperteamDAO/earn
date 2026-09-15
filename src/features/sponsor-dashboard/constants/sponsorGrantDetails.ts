import { type GrantsSelect } from '@/prisma/models/Grants';

import { type Grant } from '@/features/grants/types';

export const sponsorGrantDetailsSelect = {
  id: true,
  title: true,
  slug: true,
  token: true,
  maxReward: true,
  historicalApplications: true,
  sponsorId: true,
  isPublished: true,
  isActive: true,
  isArchived: true,
  isPaused: true,
  questions: true,
  region: true,
  status: true,
  references: true,
  airtableId: true,
  isNative: true,
  ai: true,
  emailSalutation: true,
  isST: true,
  sponsor: {
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      entityName: true,
      isVerified: true,
      chapter: {
        select: {
          id: true,
        },
      },
    },
  },
} satisfies GrantsSelect;

export type SponsorGrantDetailsResponse = Pick<
  Grant,
  | 'id'
  | 'title'
  | 'slug'
  | 'token'
  | 'maxReward'
  | 'historicalApplications'
  | 'sponsorId'
  | 'isPublished'
  | 'isActive'
  | 'isArchived'
  | 'isPaused'
  | 'questions'
  | 'region'
  | 'status'
  | 'references'
  | 'airtableId'
  | 'isNative'
  | 'ai'
  | 'emailSalutation'
  | 'isST'
  | 'sponsor'
  | 'approvedAmountTotal'
> & {
  totalApplications: number;
  grantTrancheCount: number;
};
