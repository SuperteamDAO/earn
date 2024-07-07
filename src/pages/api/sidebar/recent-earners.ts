import type { NextApiRequest, NextApiResponse } from 'next';

import type { Rewards } from '@/features/listings';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';

export default async function user(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const winningSubmissions = await prisma.submission.findMany({
      where: {
        isWinner: true,
        listing: {
          isWinnersAnnounced: true,
          isPrivate: false,
        },
      },
      select: {
        winnerPosition: true,
        user: {
          select: {
            id: true,
            username: true,
            photo: true,
            firstName: true,
            lastName: true,
          },
        },
        listing: {
          select: {
            slug: true,
            title: true,
            rewards: true,
            token: true,
          },
        },
      },
      take: 15,
      orderBy: {
        updatedAt: 'desc',
      },
    });

    const earners = winningSubmissions.map((submission) => {
      const rewards = submission.listing.rewards as Rewards;
      return {
        id: submission.user.id,
        username: submission.user.username,
        firstName: submission.user.firstName,
        lastName: submission.user.lastName,
        slug: submission.listing.slug,
        title: submission.listing.title,
        reward: rewards[submission.winnerPosition as keyof Rewards],
        rewardToken: submission.listing.token,
        photo: submission.user.photo,
      };
    });

    logger.info('Successfully fetched winning submissions', { earners });
    res.status(200).json(earners);
  } catch (error: any) {
    logger.error('Error occurred while fetching winning submissions', {
      error: error.message,
    });
    res.status(400).json({
      error: error.message,
      message: 'Error occurred while fetching totals',
    });
  }
}
