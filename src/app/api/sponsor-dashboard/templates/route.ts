import type { BountyType, Prisma } from '@prisma/client';
import { type NextRequest, NextResponse } from 'next/server';

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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') as BountyType;

  logger.debug(
    `Request query: ${safeStringify(Object.fromEntries(searchParams))}`,
  );

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
          where: {
            isPublished: true,
            status: 'OPEN',
            isPrivate: false,
            isActive: true,
          },
        },
      },
    });

    if (result.length === 0) {
      logger.warn(`No bounty templates found for type: ${type}`);
      return NextResponse.json(
        {
          message: `No bounty templates found for type=${type}.`,
        },
        { status: 404 },
      );
    }

    logger.info(`Successfully fetched bounty templates for type: ${type}`);
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    logger.error(
      `Error occurred while fetching bounty templates: ${safeStringify(err)}`,
    );
    return NextResponse.json(
      {
        error: err.message,
        message: 'Error occurred while fetching bounties.',
      },
      { status: 400 },
    );
  }
}
