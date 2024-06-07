import { type BountyType, type Prisma } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';
import { dayjs } from '@/utils/dayjs';

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
              Comments: true,
            },
          },
        },
        orderBy: {
          deadline: order,
        },
      });
      //sort bounties by isFeatured
      result.bounties = bounties.sort((a, b) => {
        if (a.isFeatured && !b.isFeatured) {
          return -1;
        } else if (!a.isFeatured && b.isFeatured) {
          return 1;
        } else {
          return 0;
        }
      });
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
              Comments: true,
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
      result.bounties = result.bounties.sort((a, b) => {
        if (a.isFeatured && !b.isFeatured) {
          return -1;
        } else if (!a.isFeatured && b.isFeatured) {
          return 1;
        } else {
          return 0;
        }
      });
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
        select: {
          id: true,
          title: true,
          slug: true,
          shortDescription: true,
          token: true,
          minReward: true,
          maxReward: true,
          link: true,
          sponsor: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
            },
          },
        },
      });
      result.grants = grants;
    }

    res.status(200).json(result);
  } catch (error) {
    console.log(error);

    res.status(400).json({
      error,
      message: 'Error occurred while fetching listings',
    });
  }
}
