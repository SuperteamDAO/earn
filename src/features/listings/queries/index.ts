import { Regions } from '@prisma/client';

import { prisma } from '@/prisma';

export type Status = 'open' | 'review' | 'completed';

const TAKE = 20;

function getStatusFilterQuery(statusFilter: Status | undefined) {
  let statusFilterQuery = {};

  if (statusFilter) {
    if (statusFilter === 'open') {
      statusFilterQuery = {
        deadline: {
          gte: new Date(),
        },
      };
    } else if (statusFilter === 'review') {
      statusFilterQuery = {
        deadline: {
          lte: new Date(),
        },
        isWinnersAnnounced: false,
      };
    } else if (statusFilter === 'completed') {
      statusFilterQuery = {
        isWinnersAnnounced: true,
      };
    }
  }

  return statusFilterQuery;
}

interface GrantProps {
  userLocation?: string | null;
}

export async function getGrants({ userLocation }: GrantProps) {
  return await prisma.grants.findMany({
    where: {
      isPublished: true,
      isActive: true,
      isArchived: false,
      ...(userLocation
        ? {
            region: {
              in: [userLocation.toUpperCase() as Regions, Regions.GLOBAL],
            },
          }
        : {}),
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

interface BountyProps {
  order?: 'asc' | 'desc';
  statusFilter?: Status;
  userLocation?: string | null;
}

export async function getListings({
  order = 'desc',
  statusFilter,
  userLocation,
}: BountyProps) {
  const statusFilterQuery = getStatusFilterQuery(statusFilter);
  let orderBy:
    | { deadline: 'asc' | 'desc' }
    | { winnersAnnouncedAt: 'asc' | 'desc' }
    | [{ isFeatured: 'desc' }, { deadline: 'asc' | 'desc' }] = {
    deadline: order,
  };
  if (statusFilter === 'open') {
    orderBy = [
      {
        isFeatured: 'desc',
      },
      {
        deadline: order,
      },
    ];
  } else if (statusFilter === 'completed') {
    orderBy = {
      winnersAnnouncedAt: order,
    };
  }

  let bounties = await prisma.bounties.findMany({
    where: {
      isPublished: true,
      isActive: true,
      isPrivate: false,
      hackathonprize: false,
      isArchived: false,
      OR: [
        { compensationType: 'fixed', usdValue: { gt: 100 } },
        { compensationType: 'range', maxRewardAsk: { gt: 100 } },
        { compensationType: 'variable' },
      ],
      language: { in: ['eng', 'sco'] }, //cuz both eng and sco refer to listings in english
      ...statusFilterQuery,
      ...(userLocation
        ? {
            region: {
              in: [userLocation.toUpperCase() as Regions, Regions.GLOBAL],
            },
          }
        : {}),
      Hackathon: null,
    },
    select: {
      rewardAmount: true,
      deadline: true,
      type: true,
      title: true,
      token: true,
      winnersAnnouncedAt: true,
      slug: true,
      applicationType: true,
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
        },
      },
      sponsor: {
        select: {
          name: true,
          slug: true,
          logo: true,
          isVerified: true,
        },
      },
    },
    orderBy,
    take: TAKE,
  });

  if (statusFilter === 'open') {
    bounties = bounties.sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) {
        return -1;
      } else if (!a.isFeatured && b.isFeatured) {
        return 1;
      } else {
        return 0;
      }
    });
  }
  return bounties;
}
