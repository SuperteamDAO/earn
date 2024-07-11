import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

async function bounty(req: NextApiRequestWithUser, res: NextApiResponse) {
  const params = req.query;
  const id = params.id as string;
  logger.debug(`Request body: ${safeStringify(req.body)}`);
  const { hackathonSponsor, ...updatedData } = req.body;

  try {
    const userId = req.userId;

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

export default withAuth(bounty);
