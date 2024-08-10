import { Regions } from '@prisma/client';

import { prisma } from '@/prisma';

const TAKE = 20;

interface GrantProps {
  userRegion?: Regions | null;
}

export async function getGrants({ userRegion }: GrantProps) {
  return await prisma.grants.findMany({
    where: {
      isPublished: true,
      isActive: true,
      isArchived: false,
      ...(userRegion ? { region: { in: [userRegion, Regions.GLOBAL] } } : {}),
    },
    take: TAKE,
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      slug: true,
      title: true,
      minReward: true,
      maxReward: true,
      token: true,
      totalApproved: true,
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
              applicationStatus: 'Approved',
            },
          },
        },
      },
    },
  });
}
