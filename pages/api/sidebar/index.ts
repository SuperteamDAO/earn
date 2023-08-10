import type { NextApiRequest, NextApiResponse } from 'next';

import type { Rewards } from '@/interface/bounty';
import { prisma } from '@/prisma';

export default async function user(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const totals = await prisma.total.findFirst();
    const winningSubmissions = await prisma.submission.findMany({
      where: {
        isWinner: true,
      },
      select: {
        winnerPosition: true,
        user: {
          select: {
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
          },
        },
      },
    });

    const earners = winningSubmissions.map((submission) => {
      const rewards = submission.listing.rewards as Rewards;
      return {
        username: submission.user.username,
        firstName: submission.user.firstName,
        lastName: submission.user.lastName,
        slug: submission.listing.slug,
        title: submission.listing.title,
        reward: rewards[submission.winnerPosition as keyof Rewards],
        photo: submission.user.photo,
      };
    });
    res.status(200).json({ totals, earners });
  } catch (error) {
    res.status(400).json({
      error,
      message: 'Error occurred while fetching totals',
    });
  }
}
