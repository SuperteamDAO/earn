import { type NextApiRequest, type NextApiResponse } from 'next';
import { z } from 'zod';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { setCacheHeaders } from '@/utils/cacheControl';

const CategoryEnum = z.enum(['design', 'content', 'development']);
export type CategoryKeys = z.infer<typeof CategoryEnum>;

const querySchema = z.object({
  filter: CategoryEnum,
});

export default async function categoryEarnings(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const { filter } = querySchema.parse(req.query);

    const filterToSkillsMap: Record<CategoryKeys, string[]> = {
      development: ['Frontend', 'Backend', 'Blockchain', 'Mobile'],
      design: ['Design'],
      content: ['Content'],
    };

    const skillsToFilter = filterToSkillsMap[filter] || [];
    let skillsFilter = {};

    if (skillsToFilter.length > 0) {
      if (filter === 'development') {
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

    const result = await prisma.bounties.aggregate({
      where: {
        isWinnersAnnounced: true,
        isPublished: true,
        status: 'OPEN',
        ...skillsFilter,
      },
      _sum: {
        usdValue: true,
      },
    });

    setCacheHeaders(res, {
      public: true,
      // 1 day
      maxAge: 24 * 60 * 60,
      sMaxAge: 24 * 60 * 60,
      staleWhileRevalidate: 60 * 60, // 1 hour
    });

    return res.status(200).json({
      totalEarnings: Math.round(result._sum.usdValue || 0),
    });
  } catch (error) {
    logger.error('Error in categoryEarnings:', error);
    return res.status(400).json({ error: 'Invalid request' });
  }
}
