import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

import { prisma } from '@/prisma';

export default async function bounty(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const params = req.query;
  const id = params.id as string;
  const { hackathonSponsor, ...updatedData } = req.body;

  try {
    const token = await getToken({ req });

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = token.id;

    if (!userId) {
      return res.status(400).json({ error: 'Invalid token' });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId as string,
      },
    });

    if (!user) {
      return res.status(403).json({ error: 'User does not exist.' });
    }

    const currentBounty = await prisma.bounties.findUnique({
      where: { id },
    });

    if (!currentBounty) {
      return res
        .status(404)
        .json({ message: `Bounty with id=${id} not found.` });
    }

    if (
      user.currentSponsorId !== currentBounty?.sponsorId &&
      user.hackathonId !== currentBounty.hackathonId
    ) {
      return res.status(403).json({
        error: 'User does not match the current sponsor or hackathon ID.',
      });
    }

    const newRewardsCount = Object.keys(updatedData.rewards || {}).length;
    const currentTotalWinners = currentBounty.totalWinnersSelected || 0;

    if (newRewardsCount < currentTotalWinners) {
      updatedData.totalWinnersSelected = newRewardsCount;

      const positions = ['first', 'second', 'third', 'fourth', 'fifth'];
      const positionsToReset = positions.slice(newRewardsCount);

      for (const position of positionsToReset) {
        await prisma.submission.updateMany({
          where: {
            listingId: id,
            isWinner: true,
            winnerPosition: position,
          },
          data: {
            isWinner: false,
            winnerPosition: null,
          },
        });
      }
    }

    const sponsorId = hackathonSponsor;
    const result = await prisma.bounties.update({
      where: { id, sponsorId },
      data: {
        sponsorId,
        ...updatedData,
      },
    });

    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      error,
      message: `Error occurred while updating bounty with id=${id}.`,
    });
  }
}
