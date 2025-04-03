import type { BountyType, Prisma } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

export type BountyTemplateWithSponsor = Prisma.BountiesTemplatesGetPayload<{
  select: {
    id: true;
    title: true;
    description: true;
    skills: true;
    rewards: true;
    rewardAmount: true;
    minRewardAsk: true;
    maxRewardAsk: true;
    maxBonusSpots: true;
    emoji: true;
    compensationType: true;
    type: true;
    token: true;
    color: true;
    language: true;
    eligibility: true;
    region: true;
    slug: true;
    Bounties: {
      select: {
        sponsor: {
          select: {
            name: true;
            logo: true;
          };
        };
      };
    };
  };
}>;

export default async function bounties(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const type = req.query.type as BountyType;

  logger.debug(`Request query: ${safeStringify(req.query)}`);

  try {
    logger.debug(`Fetching bounty templates of type: ${type}`);
    const result = await prisma.bountiesTemplates.findMany({
      where: {
        isActive: true,
        isArchived: false,
        type,
      },
      take: 20,
      select: {
        id: true,
        title: true,
        description: true,
        skills: true,
        rewards: true,
        rewardAmount: true,
        minRewardAsk: true,
        maxRewardAsk: true,
        maxBonusSpots: true,
        emoji: true,
        compensationType: true,
        type: true,
        token: true,
        color: true,
        language: true,
        eligibility: true,
        region: true,
        slug: true,
        Bounties: {
          distinct: ['sponsorId'],
          take: 3,
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            sponsor: {
              select: {
                name: true,
                logo: true,
              },
            },
          },
        },
      },
    });

    if (result.length === 0) {
      logger.warn(`No bounty templates found for type: ${type}`);
      return res.status(404).json({
        message: `No bounty templates found for type=${type}.`,
      });
    }

    logger.info(`Successfully fetched bounty templates for type: ${type}`);
    return res.status(200).json(result);
  } catch (err: any) {
    logger.error(
      `Error occurred while fetching bounty templates: ${safeStringify(err)}`,
    );
    return res.status(400).json({
      error: err.message,
      message: 'Error occurred while fetching bounties.',
    });
  }
}
