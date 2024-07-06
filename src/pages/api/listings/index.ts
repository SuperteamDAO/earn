import { type BountyType, type Prisma } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';

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

export default async function user(req: NextApiRequest, res: NextApiResponse) {
  const params = req.query;
  const category = params.category as string;
  const isHomePage = params.isHomePage === 'true';
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

  try {
    if (!category || category === 'all') {
      const bounties = await prisma.bounties.findMany({
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
          ...(isHomePage ? { rewardAmount: { gt: 100 } } : {}),
          ...skillsFilter,
        },
        include: {
          sponsor: {
            select: {
              name: true,
              slug: true,
              logo: true,
            },
          },
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
        },
        orderBy: [
          {
            winnersAnnouncedAt: 'desc',
          },
          {
            deadline: order,
          },
        ],
      });
      //sort bounties by isFeatured
      result.bounties = sortListings(bounties);
    } else if (category === 'bounties') {
      const bounties = await prisma.bounties.findMany({
        where: {
          isPublished: true,
          isActive: true,
          isPrivate: false,
          hackathonprize: false,
          isArchived: false,
          status: 'OPEN',
          type,
          deadline: {
            gte: deadline,
          },
          ...(isHomePage ? { rewardAmount: { gt: 100 } } : {}),
          ...skillsFilter,
          Hackathon: null,
        },
        include: {
          sponsor: {
            select: {
              name: true,
              slug: true,
              logo: true,
            },
          },
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
        },
        orderBy: {
          deadline: order,
        },
      });
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
      const grants = await prisma.grants.findMany({
        where: {
          isPublished: true,
          isActive: true,
          isArchived: false,
          ...skillsFilter,
        },
        take,
        orderBy: {
          updatedAt: order,
        },
        include: {
          sponsor: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
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
