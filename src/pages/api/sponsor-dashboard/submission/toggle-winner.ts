import type { NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { fetchTokenUSDValue } from '@/utils/fetchTokenUSDValue';

import { type NextApiRequestWithSponsor } from '@/features/auth/types';
import { checkListingSponsorAuth } from '@/features/auth/utils/checkListingSponsorAuth';
import { withSponsorAuth } from '@/features/auth/utils/withSponsorAuth';
import { type Rewards } from '@/features/listings/types';

async function handler(req: NextApiRequestWithSponsor, res: NextApiResponse) {
  const userId = req.userId;

  logger.debug(`Request body: ${JSON.stringify(req.body)}`);
  const { id, isWinner, winnerPosition } = req.body;

  if (
    (isWinner !== undefined && winnerPosition === undefined) ||
    (isWinner === undefined && winnerPosition !== undefined)
  ) {
    return res.status(400).json({
      error:
        'isWinner and winnerPosition must be provided together if either is present',
    });
  }

  try {
    const currentSubmission = await prisma.submission.findUnique({
      where: { id },
    });

    if (!currentSubmission) {
      logger.warn(`Submission with ID ${id} not found`);
      return res.status(404).json({
        message: `Submission with ID ${id} not found.`,
      });
    }

    const userSponsorId = req.userSponsorId;

    const { listing, error } = await checkListingSponsorAuth(
      userSponsorId,
      currentSubmission.listingId,
    );
    if (error) {
      return res.status(error.status).json({ error: error.message });
    }
    const isSponsorship = listing.type === 'sponsorship';

    if (listing.isWinnersAnnounced) {
      return res.status(400).json({
        error: 'Submissions cant be toggled post winner announcement',
      });
    }

    let position = winnerPosition;
    if (isSponsorship) {
      const maxPosition = await prisma.submission.count({
        where: { listingId: currentSubmission.listingId, isWinner: true },
      });
      position = maxPosition + 1;
    }

    logger.debug(`Updating submission with ID: ${id}`);
    const result = await prisma.submission.update({
      where: { id },
      data: {
        isWinner,
        winnerPosition: position ? position : null,
      },
      include: { listing: true },
    });

    const ask = result.ask || 0;

    if (currentSubmission.isWinner !== isWinner) {
      const bountyId = result.listingId;
      const totalWinnersUpdate = {
        totalWinnersSelected: isWinner ? { increment: 1 } : { decrement: 1 },
      };

      logger.debug(`Updating bounty total winners for listing ID: ${bountyId}`);

      const listing = result.listing;
      if (listing.compensationType !== 'fixed') {
        logger.debug('Fetching token USD value for variable compensation');
        const tokenUSDValue = await fetchTokenUSDValue(
          listing.token! === 'Any' ? currentSubmission.token! : listing.token!,
          listing.publishedAt!,
        );
        const usdValue = tokenUSDValue * ask;
        const oldRewards = isSponsorship
          ? (listing.rewards as Rewards) || {}
          : {};
        await prisma.bounties.update({
          where: { id: bountyId },
          data: {
            ...totalWinnersUpdate,
            rewards: { ...(oldRewards as Rewards), [position]: ask },
            rewardAmount: ask,
            usdValue: { increment: usdValue },
          },
        });
      } else {
        await prisma.bounties.update({
          where: { id: bountyId },
          data: totalWinnersUpdate,
        });
      }
    }

    logger.info(`Successfully updated submission with ID: ${id}`);
    return res.status(200).json({ message: 'Success' });
  } catch (error: any) {
    logger.error(`User ${userId} unable to toggle winners: ${error.message}`);
    return res.status(400).json({
      error: error.message,
      message: `Error occurred while updating submission ${id}.`,
    });
  }
}

export default withSponsorAuth(handler);
