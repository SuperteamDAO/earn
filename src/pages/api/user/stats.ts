import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const token = await getToken({ req });
    logger.debug(`Token retrieved: ${safeStringify(token)}`);

    if (!token) {
      logger.warn('Unauthorized request - No token provided');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userEmail = token.email;
    logger.debug(`User email from token: ${userEmail}`);

    if (!userEmail) {
      logger.warn('Invalid token - No email found');
      return res.status(400).json({ error: 'Invalid token' });
    }

    const result = await prisma.user.findUnique({
      where: {
        email: userEmail,
      },
      select: {
        Submission: {
          select: {
            isWinner: true,
            rewardInUSD: true,
            listing: {
              select: {
                isWinnersAnnounced: true,
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
      },
    });

    if (!result) {
      logger.warn(`User not found for email: ${userEmail}`);
      return res.status(404).json({ error: 'User not found' });
    }

    const participations = result.Submission.length;
    const wins = result.Submission.filter(
      (s) => s.isWinner && s.listing.isWinnersAnnounced,
    ).length;

    const listingWinnings = result.Submission.filter(
      (s) => s.isWinner && s.listing.isWinnersAnnounced,
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
      `User data retrieved successfully: participations=${participations}, wins=${wins}, totalWinnings=${wins}`,
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
