import { Regions } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';

import { Superteams } from '@/constants/Superteam';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

export default async function user(req: NextApiRequest, res: NextApiResponse) {
  const params = req.query;
  const region = params.region as string;
  const take = params.take ? parseInt(params.take as string, 10) : 30;

  logger.debug(`Request query: ${safeStringify(req.query)}`);

  const st = Superteams.find((team) => team.region.toLowerCase() === region);
  const superteam = st?.name;

  logger.debug(`Superteam for region ${region}: ${superteam}`);

  const result: { bounties: any[]; grants: any[] } = {
    bounties: [],
    grants: [],
  };

  try {
    logger.debug('Fetching bounties');
    const bounties = await prisma.bounties.findMany({
      where: {
        isPublished: true,
        isActive: true,
        isArchived: false,
        isPrivate: false,
        status: 'OPEN',
        OR: [
          {
            region: {
              in: [region.toUpperCase() as Regions],
            },
          },
          {
            sponsor: {
              name: superteam,
            },
          },
        ],
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
      orderBy: {
        deadline: 'desc',
      },
    });
    result.bounties = bounties;

    logger.debug('Fetching grants');
    const grants = await prisma.grants.findMany({
      where: {
        isPublished: true,
        isActive: true,
        isArchived: false,
        region: {
          in: [region.toUpperCase() as Regions, Regions.GLOBAL],
        },
      },
      orderBy: {
        createdAt: 'desc',
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
    });

    result.grants = grants;

    logger.info(`Successfully fetched listings for region=${region}`);
    return res.status(200).json(result);
  } catch (error: any) {
    logger.error(
      `Error fetching listings for region=${region}: ${safeStringify(error)}`,
    );
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Error occurred while fetching listings',
    });
  }
}
