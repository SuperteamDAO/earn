import { type BountyType, type Prisma, Regions } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

import { CombinedRegions } from '@/constants/Superteam';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { dayjs } from '@/utils/dayjs';

interface Listing {
  id?: string;
  winnersAnnouncedAt?: Date | null;
  deadline: Date | null;
  isFeatured: boolean;
}

function sortListings(listings: Listing[]): Listing[] {
  const today = new Date();

  return listings.sort((a, b) => {
    const deadlineA = a.deadline;
    const deadlineB = b.deadline;

    if (deadlineA && deadlineA > today && deadlineB && deadlineB > today) {
      // Sort by isFeatured descending if deadline is greater than today
      if (b.isFeatured !== a.isFeatured) {
        return b.isFeatured ? 1 : -1;
      }

      // Sort by deadline ascending (earliest deadline first) if isFeatured is the same
      return deadlineA.getTime() - deadlineB.getTime();
    }

    if (deadlineA && deadlineA <= today && deadlineB && deadlineB <= today) {
      // Sort by deadline descending if deadline is less than or equal to today
      if (deadlineA.getTime() !== deadlineB.getTime()) {
        return deadlineB.getTime() - deadlineA.getTime();
      }

      // Sort by winnersAnnouncedAt if deadline is less than or equal to today and winnersAnnouncedAt exists
      const winnersAnnouncedAtA = a.winnersAnnouncedAt;
      const winnersAnnouncedAtB = b.winnersAnnouncedAt;
      if (winnersAnnouncedAtA && winnersAnnouncedAtB) {
        return winnersAnnouncedAtB.getTime() - winnersAnnouncedAtA.getTime();
      } else if (winnersAnnouncedAtA && !winnersAnnouncedAtB) {
        return -1;
      } else if (!winnersAnnouncedAtA && winnersAnnouncedAtB) {
        return 1;
      }
    }

    // Sort listings with earlier deadlines or null deadlines first
    if (deadlineA === null && deadlineB !== null) {
      return 1;
    } else if (deadlineA !== null && deadlineB === null) {
      return -1;
    }

    return 0;
  });
}

export default async function listings(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const params = req.query;
  const category = params.category as string;
  const order = (params.order as 'asc' | 'desc') ?? 'desc';

  const filter = params.filter as string;
  const type = params.type as
    | Prisma.EnumBountyTypeFilter
    | BountyType
    | undefined;
  const take = params.take ? parseInt(params.take as string, 10) : 10;
  const deadline = params.deadline as string;

  const result: { bounties: any[]; grants: any[] } = {
    bounties: [],
    grants: [],
  };
  const filterToSkillsMap: Record<string, string[]> = {
    development: ['Frontend', 'Backend', 'Blockchain', 'Mobile'],
    design: ['Design'],
    content: ['Content'],
    other: ['Other', 'Growth', 'Community'],
  };

  const skillsToFilter = filterToSkillsMap[filter] || [];

  let skillsFilter = {};
  if (skillsToFilter.length > 0) {
    if (filter === 'development' || filter === 'other') {
      skillsFilter = {
        OR: skillsToFilter.map((skill) => ({
          skills: {
            path: '$[*].skills',
            array_contains: [skill],
          },
        })),
      };
    } else {
      skillsFilter = {
        skills: {
          path: '$[*].skills',
          array_contains: skillsToFilter,
        },
      };
    }
  }

  const token = await getToken({ req });
  const userId = token?.sub;
  let userRegion: Regions = Regions.GLOBAL;
  if (userId) {
    const user = await prisma.user.findFirst({
      where: { id: userId },
      select: { location: true },
    });
    const matchedRegion = CombinedRegions.find(
      (region) => user?.location && region.country.includes(user?.location),
    );
    userRegion = matchedRegion ? matchedRegion.region : Regions.GLOBAL;
  }

  const bountyQueryOptions: Prisma.BountiesFindManyArgs = {
    where: {
      isPublished: true,
      isActive: true,
      isPrivate: false,
      hackathonprize: false,
      isArchived: false,
      status: 'OPEN',
      Hackathon: null,
      deadline: {
        gte: deadline,
      },
      type,
      ...skillsFilter,
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
    take,
    orderBy: [
      {
        deadline: order,
      },
      {
        winnersAnnouncedAt: 'desc',
      },
    ],
  };

  const grantQueryOptions: Prisma.GrantsFindManyArgs = {
    where: {
      isPublished: true,
      isActive: true,
      isArchived: false,
      ...skillsFilter,
    },
    take,
    orderBy: {
      createdAt: order,
    },
    include: {
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
  };

  if (userRegion) {
    bountyQueryOptions.where = {
      ...bountyQueryOptions.where,
      region: {
        in: [userRegion, Regions.GLOBAL],
      },
    };

    grantQueryOptions.where = {
      ...grantQueryOptions.where,
      region: {
        in: [userRegion, Regions.GLOBAL],
      },
    };
  }

  try {
    if (!category || category === 'all') {
      const bounties = await prisma.bounties.findMany(bountyQueryOptions);
      //sort bounties by isFeatured
      result.bounties = sortListings(bounties);
    } else if (category === 'bounties') {
      const bounties = await prisma.bounties.findMany(bountyQueryOptions);

      const splitIndex = bounties.findIndex((bounty) =>
        dayjs().isAfter(dayjs(bounty?.deadline)),
      );
      if (splitIndex >= 0) {
        const bountiesOpen = bounties.slice(0, splitIndex).reverse();
        const bountiesClosed = bounties.slice(splitIndex);

        result.bounties = [...bountiesOpen, ...bountiesClosed];
      } else {
        result.bounties = bounties.slice(0, take);
      }
      result.bounties = sortListings(bounties);
    }

    if (!category || category === 'all' || category === 'grants') {
      const grants = await prisma.grants.findMany(grantQueryOptions);
      result.grants = grants;
    }

    res.status(200).json(result);
  } catch (error) {
    logger.error(error);

    res.status(400).json({
      error,
      message: 'Error occurred while fetching listings',
    });
  }
}
