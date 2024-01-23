import { status } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const sponsors = await prisma.sponsors.findMany();

    for (const sponsor of sponsors) {
      const sponsorId = sponsor.id;

      const commonWhere = {
        sponsorId,
        isWinnersAnnounced: true,
        isActive: true,
        isArchived: false,
        status: status.OPEN,
      };

      const totalRewardResult = await prisma.bounties.aggregate({
        where: commonWhere,
        _sum: {
          rewardAmount: true,
        },
      });

      const totalRewardAmount = totalRewardResult._sum.rewardAmount || 0;

      await prisma.sponsors.update({
        where: { id: sponsorId },
        data: {
          totalRewardedInUSD: totalRewardAmount,
        },
      });
    }

    res.status(200).json({ message: 'Sponsor rewards updated successfully.' });
  } catch (error) {
    console.error('Error updating sponsor rewards:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
