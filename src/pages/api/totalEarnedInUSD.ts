/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const users = await prisma.user.findMany({
      include: {
        Submission: {
          where: {
            isWinner: true,
            listing: {
              isWinnersAnnounced: true,
            },
          },
          include: {
            listing: true,
          },
        },
      },
    });

    for (const user of users) {
      let totalEarnings = 0;

      for (const submission of user.Submission) {
        const { rewards } = submission.listing;
        if (rewards && submission.winnerPosition) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          const positionReward = rewards[submission.winnerPosition];
          if (positionReward) {
            totalEarnings += positionReward;
          }
        }
      }

      if (totalEarnings > 0) {
        await prisma.user.update({
          where: { id: user.id },
          data: { totalEarnedInUSD: totalEarnings },
        });
      }
    }
    res.status(200).json({ message: 'Earnings updated successfully' });
  } catch (error) {
    console.error('Request error', error);
    res.status(500).json({ error: 'Error updating earnings' });
  }
}
