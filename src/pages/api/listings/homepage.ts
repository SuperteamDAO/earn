import { type BountyType } from '@prisma/client';
import { type NextApiRequest, type NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

export type Skills = 'development' | 'design' | 'content' | 'other';
export type Status = 'open' | 'review' | 'completed';

const filterToSkillsMap: Record<string, string[]> = {
  development: ['Frontend', 'Backend', 'Blockchain', 'Mobile'],
  design: ['Design'],
  content: ['Content'],
  other: ['Other', 'Growth', 'Community'],
};

function getSkillFilterQuery(skillFilter: Skills | undefined) {
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

  return skillFilterQuery;
}

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
  order?: 'asc' | 'desc';
  take?: number;
  skillFilter?: Skills;
}

export async function getGrants({ take = 20, skillFilter }: GrantProps) {
  const skillFilterQuery = getSkillFilterQuery(skillFilter);
  return await prisma.grants.findMany({
    where: {
      isPublished: true,
      isActive: true,
      isArchived: false,
      ...skillFilterQuery,
    },
    take,
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
  skillFilter?: Skills;
  statusFilter?: Status;
  type?: BountyType;
  take?: number;
  userLocation?: string;
}

export async function getListings({
  order = 'desc',
  skillFilter,
  statusFilter,

  take = 20,
  userLocation,
}: BountyProps) {
  const skillFilterQuery = getSkillFilterQuery(skillFilter);

  const statusFilterQuery = getStatusFilterQuery(statusFilter);
  logger.debug(
    `Bounty status filter query: ${safeStringify(statusFilterQuery)}`,
  );

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
      OR: [{ region: userLocation }, { region: 'GLOBAL' }],

      AND: [
        {
          OR: [
            { compensationType: 'fixed', usdValue: { gt: 100 } },
            { compensationType: 'range', maxRewardAsk: { gt: 100 } },
            { compensationType: 'variable' },
          ],
        },
      ],
      language: { in: ['eng', 'sco'] }, //cuz both eng and sco refer to listings in english
      ...skillFilterQuery,
      ...statusFilterQuery,
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
    take,
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

  logger.debug(`Fetched bounties`);
  return bounties;
}

export default async function listings(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const params = req.query;
  const includeGrants = !!params.grants;
  const order = (params.order as 'asc' | 'desc') ?? 'desc';

  const skillFilter = params.skill as Skills | undefined;
  const statusFilter = params.status as Status | undefined;
  const type = params.type as BountyType | undefined;
  const take = params.take ? parseInt(params.take as string, 20) : 20;

  logger.debug(`Request params: ${safeStringify(params)}`);

  try {
    const bounties = await getListings({
      order,
      skillFilter,
      statusFilter,
      type,
      take,
    });

    let grants: Awaited<ReturnType<typeof getGrants>> | undefined = undefined;
    if (includeGrants) {
      grants = await getGrants({ take });
    }

    logger.info('Fetched listings successfully');
    res.status(200).json({
      bounties,
      grants,
    });
  } catch (error: any) {
    logger.error(
      `Error occurred while fetching listings: ${safeStringify(error)}`,
    );
    res.status(400).json({
      error: error.message,
      message: 'Error occurred while fetching listings',
    });
  }
}
