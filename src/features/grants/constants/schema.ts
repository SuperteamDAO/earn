import type { GrantsSelect } from '@/prisma/models/Grants';

export const grantsSelect = {
  slug: true,
  title: true,
  minReward: true,
  maxReward: true,
  token: true,
  historicalApplications: true,
  totalPaid: true,
  logo: true,
  isST: true,
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
  GrantApplication: {
    where: {
      OR: [
        { applicationStatus: 'Approved' },
        { applicationStatus: 'Completed' },
      ],
    },
    select: {
      approvedAmountInUSD: true,
    },
  },
} satisfies GrantsSelect;
