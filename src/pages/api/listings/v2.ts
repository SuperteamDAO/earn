import { type BountyType } from '@prisma/client';
import { type NextApiRequest, type NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export type Skills = 'development' | 'design' | 'content' | 'other';
export type Status = 'open' | 'review' | 'completed';

const filterToSkillsMap: Record<string, string[]> = {
  development: ['Frontend', 'Backend', 'Blockchain', 'Mobile'],
  design: ['Design'],
  content: ['Content'],
  other: ['Other', 'Growth', 'Community'],
};

interface Props {
  category?: string;
  order: 'asc' | 'desc';
  isHomePage: boolean;
  skillFilter?: Skills;
  statusFilter?: Status;
  type?: BountyType;
  take: number;
}

export async function getListings({
  category,
  order,
  isHomePage,
  skillFilter,
  statusFilter,
  type,
  take,
}: Props) {
  const result: { bounties: any[]; grants: any[] } = {
    bounties: [],
    grants: [],
  };

  let skillFilterQuery = {};
  if (skillFilter) {
    const skillsToFilter = filterToSkillsMap[skillFilter] || [];
    if (skillsToFilter.length > 0) {
      skillFilterQuery = {
        OR: skillsToFilter.map((skill) => ({
          skills: {
            path: '$[*].skills',
            array_contains: [skill],
          },
        })),
      };
    }
  }

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

  const bounties = await prisma.bounties.findMany({
    where: {
      isPublished: true,
      isActive: true,
      isPrivate: false,
      hackathonprize: false,
      isArchived: false,
      type,
      ...(isHomePage
        ? {
            OR: [
              { compensationType: 'fixed', usdValue: { gte: 100 } },
              { compensationType: 'range', maxRewardAsk: { gte: 100 } },
              { compensationType: 'variable' },
            ],
          }
        : {}),
      ...skillFilterQuery,
      ...statusFilterQuery,
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
    orderBy,
    take,
  });
  result.bounties = bounties;
  if (statusFilter === 'open') {
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
        ...skillFilterQuery,
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
  return result;
}

export default async function listings(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const params = req.query;
  const category = params.category as string | undefined;
  const order = (params.order as 'asc' | 'desc') ?? 'desc';
  const isHomePage = params.isHomePage === 'true';

  const skillFilter = params.skill as Skills | undefined;
  const statusFilter = params.status as Status | undefined;
  const type = params.type as BountyType | undefined;
  const take = params.take ? parseInt(params.take as string, 20) : 20;
  // const deadline = params.deadline as string | undefined;

  try {
    const result = await getListings({
      category,
      order,
      isHomePage,
      skillFilter,
      statusFilter,
      type,
      take,
    });

    res.status(200).json(result);
  } catch (error) {
    console.log(error);

    res.status(400).json({
      error,
      message: 'Error occurred while fetching listings',
    });
  }
}
