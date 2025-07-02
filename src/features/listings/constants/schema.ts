import { z } from 'zod';

import { type Prisma } from '@/interface/prisma/namespace';

export const ListingTabSchema = z
  .enum(['all', 'bounties', 'projects'])
  .default('all');
export const OrderDirectionSchema = z.enum(['asc', 'desc']).default('asc');
export const ListingCategorySchema = z
  .enum(['For You', 'All', 'Content', 'Design', 'Development', 'Other'])
  .default('All');
export const ListingStatusSchema = z
  .enum(['open', 'review', 'completed'])
  .default('open');
export const ListingSortOptionSchema = z
  .enum(['Date', 'Prize', 'Submissions'])
  .default('Date');
export const ListingContextSchema = z
  .enum(['home', 'all', 'region', 'region-all', 'sponsor'])
  .default('all');

export const QueryParamsSchema = z.object({
  tab: ListingTabSchema,
  order: OrderDirectionSchema,
  category: ListingCategorySchema,
  status: ListingStatusSchema,
  sortBy: ListingSortOptionSchema,
  context: ListingContextSchema,
  region: z.string().optional(),
  sponsor: z.string().optional(),
});

export const listingSelect = {
  id: true,
  rewardAmount: true,
  deadline: true,
  type: true,
  title: true,
  token: true,
  winnersAnnouncedAt: true,
  slug: true,
  isWinnersAnnounced: true,
  isFeatured: true,
  compensationType: true,
  minRewardAsk: true,
  maxRewardAsk: true,
  status: true,
  _count: {
    select: {
      Comments: {
        where: {
          isActive: true,
          isArchived: false,
          replyToId: null,
          type: {
            not: 'SUBMISSION',
          },
        },
      },
      Submission: true,
    },
  },
  sponsor: {
    select: {
      name: true,
      slug: true,
      logo: true,
      isVerified: true,
      st: true,
    },
  },
} satisfies Prisma.BountiesSelect;
