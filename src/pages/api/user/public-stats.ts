import type { NextApiRequest, NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { withPotentialSponsorAuth } from '@/features/auth/utils/withPotentialSponsorAuth';

import { shouldDisplayUserProfile } from './info';

export async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    logger.info(`Request body: ${safeStringify(req.body)}`);

    const { username } = req.body;

    const result = await prisma.user.findUnique({
      where: { username },
      select: {
        Submission: {
          select: {
            isWinner: true,
            rewardInUSD: true,
            listing: {
              select: {
                isWinnersAnnounced: true,
                type: true,
              },
            },
          },
        },
        GrantApplication: {
          select: {
            approvedAmountInUSD: true,
            applicationStatus: true,
          },
        },
        private: true,
        id: true,
      },
    });

    if (!result) {
      logger.warn(`User not found for username: ${username}`);
      return res.status(404).json({ error: 'User not found' });
    }
    const shouldDisplay = await shouldDisplayUserProfile(result, req);
    if (!shouldDisplay) {
      logger.info(`Private profile stats requested for username: ${username}`);
      return res.status(200).json({
        participations: 0,
        wins: 0,
        totalWinnings: 0,
      });
    }

    const participations = result.Submission.length;
    const wins = result.Submission.filter(
      (s) =>
        s.isWinner &&
        (s.listing.isWinnersAnnounced || s.listing.type === 'sponsorship'),
    ).length;

    const listingWinnings = result.Submission.filter(
      (s) =>
        s.isWinner &&
        (s.listing.isWinnersAnnounced || s.listing.type === 'sponsorship'),
    ).reduce((sum, submission) => sum + (submission.rewardInUSD || 0), 0);

    const grantWinnings = result.GrantApplication.filter(
      (g) =>
        g.applicationStatus === 'Approved' ||
        g.applicationStatus === 'Completed',
    ).reduce(
      (sum, application) => sum + (application.approvedAmountInUSD || 0),
      0,
    );

    const totalWinnings = listingWinnings + grantWinnings;

    logger.info('wins - ', wins);

    logger.info(
      `User data retrieved successfully: participations=${participations}, wins=${wins}, totalWinnings=${totalWinnings}`,
    );

    return res.status(200).json({
      participations,
      wins,
      totalWinnings,
    });
  } catch (err) {
    logger.error(
      `Error occurred while processing the request: ${safeStringify(err)}`,
    );
    return res
      .status(500)
      .json({ error: 'Error occurred while processing the request.' });
  }
}

export default withPotentialSponsorAuth(handler);
