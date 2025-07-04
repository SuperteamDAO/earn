import { z } from 'zod';

import { type Prisma } from '@/interface/prisma/namespace';

export const GrantCategorySchema = z
  .enum(['All', 'Content', 'Design', 'Development', 'Other'])
  .default('All');

export const GrantContextSchema = z
  .enum(['home', 'all', 'region', 'sponsor'])
  .default('all');

export const GrantQueryParamsSchema = z.object({
  category: GrantCategorySchema,
  context: GrantContextSchema,
  region: z.string().optional(),
  sponsor: z.string().optional(),
});

export const grantsSelect = {
  slug: true,
  title: true,
  minReward: true,
  maxReward: true,
  token: true,
  totalApproved: true,
  historicalApplications: true,
  totalPaid: true,
  logo: true,
  sponsor: {
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      isVerified: true,
    },
  },
  _count: {
    select: {
      GrantApplication: {
        where: {
          OR: [
            { applicationStatus: 'Approved' },
            { applicationStatus: 'Completed' },
          ],
        },
      },
    },
  },
} satisfies Prisma.GrantsSelect;
