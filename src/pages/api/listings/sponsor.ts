import { type NextApiRequest, type NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { sponsor, type } = req.body;

  logger.debug(`Request body: ${safeStringify(req.body)}`);

  if (!sponsor) {
    logger.warn('Sponsor is required');
    return res.status(400).json({ message: 'Sponsor is required' });
  }

  const sponsorKey = sponsor.toLowerCase();

  try {
    logger.debug(`Fetching bounties for sponsor: ${sponsorKey}`);
    const bounties = await prisma.bounties.findMany({
      where: {
        isPublished: true,
        isActive: true,
        isArchived: false,
        isPrivate: false,
        status: 'OPEN',
        sponsor: {
          slug: sponsor,
        },
        type: type || { in: ['bounty', 'project'] },
      },
      select: {
        rewardAmount: true,
        deadline: true,
        isPublished: true,
        isPrivate: true,
        type: true,
        title: true,
        token: true,
        winnersAnnouncedAt: true,
        slug: true,
        isWinnersAnnounced: true,
        isFeatured: true,
        sequentialId: true,
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
            url: true,
            twitter: true,
          },
        },
      },
      orderBy: {
        deadline: 'asc',
      },
    });

    const result = {
      bounties,
    };

    logger.info(`Successfully fetched listings for sponsor: ${sponsorKey}`);
    res.status(200).json(result);
  } catch (error: any) {
    logger.error(
      `Error fetching listings for sponsor=${sponsorKey}: ${safeStringify(error)}`,
    );
    res.status(500).json({
      error: 'Internal server error',
      message: 'Error occurred while fetching listings',
    });
  }
}
