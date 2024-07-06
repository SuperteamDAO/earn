import { Regions } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';

import { Superteams } from '@/constants/Superteam';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';

export default async function user(req: NextApiRequest, res: NextApiResponse) {
  const params = req.query;
  const region = params.region as string;
  const take = params.take ? parseInt(params.take as string, 10) : 30;

  const st = Superteams.find((team) => team.region.toLowerCase() === region);
  const superteam = st?.name;

  const result: any = {
    bounties: [],
    grants: [],
  };

  try {
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
      include: {
        sponsor: {
          select: {
            name: true,
            slug: true,
            logo: true,
          },
        },
      },
      take,
      orderBy: {
        deadline: 'desc',
      },
    });
    result.bounties = bounties;

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
        updatedAt: 'desc',
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

    res.status(200).json(result);
  } catch (error) {
    logger.error(error);

    res.status(400).json({
      error,
      message: 'Error occurred while fetching listings',
    });
  }
}
