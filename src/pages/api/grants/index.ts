import { Regions } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

import { filterRegionCountry, getCombinedRegion } from '@/features/listings';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

export default async function grants(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    logger.debug('Fetching grants from database');

    const params = req.query;
    const order = (params.order as 'asc' | 'desc') ?? 'desc';
    const filter = params.filter as string;
    const take = params.take ? parseInt(params.take as string, 10) : 100;
    let excludeIds = params['excludeIds[]'];
    if (typeof excludeIds === 'string') {
      excludeIds = [excludeIds];
    }

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
    let userRegion: string[] | null | undefined = null;
    if (userId) {
      const user = await prisma.user.findFirst({
        where: { id: userId },
        select: { location: true },
      });

      const matchedRegion = user?.location
        ? getCombinedRegion(user?.location, true)
        : undefined;

      if (matchedRegion?.name) {
        userRegion = [
          matchedRegion.name,
          Regions.GLOBAL,
          ...(filterRegionCountry(matchedRegion, user?.location || '')
            .country || []),
        ];
      } else {
        userRegion = [Regions.GLOBAL];
      }
    }

    const grants = await prisma.grants.findMany({
      where: {
        id: {
          notIn: excludeIds,
        },
        isPublished: true,
        isActive: true,
        isArchived: false,
        ...skillsFilter,
        ...(userRegion ? { region: { in: userRegion } } : {}),
        isPrivate: false,
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
                OR: [
                  {
                    applicationStatus: 'Approved',
                  },
                  {
                    applicationStatus: 'Completed',
                  },
                ],
              },
            },
          },
        },
      },
    });

    const grantsWithTotalApplications = grants.map((grant) => ({
      ...grant,
      totalApplications:
        grant._count.GrantApplication + grant.historicalApplications,
    }));

    logger.info(`Fetched ${grants.length} grants successfully`);
    return res.status(200).json(grantsWithTotalApplications);
  } catch (error: any) {
    logger.error(
      `Error occurred while fetching grants: ${safeStringify(error)}`,
    );
    return res
      .status(400)
      .json({ err: 'Error occurred while fetching grants.' });
  }
}
