import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function user(req: NextApiRequest, res: NextApiResponse) {
  const { id, isWinner, winnerPosition } = req.body;
  try {
    const result = await prisma.submission.update({
      where: {
        id,
      },
      data: {
        isWinner,
        winnerPosition,
      },
    });
    const bountyId = result.listingId;
    const updatedBounty = {
      totalWinnersSelected: {},
    };
    if (isWinner) {
      updatedBounty.totalWinnersSelected = {
        increment: 1,
      };
    } else {
      updatedBounty.totalWinnersSelected = {
        decrement: 1,
      };
    }
    await prisma.bounties.update({
      where: {
        id: bountyId,
      },
      data: {
        ...updatedBounty,
      },
    });
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      error,
      message: `Error occurred while updating submission ${id}.`,
    });
  }
}
