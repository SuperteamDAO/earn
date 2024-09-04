import type { NextApiResponse } from 'next';

import { BONUS_REWARD_POSITION } from '@/constants';
import {
  type NextApiRequestWithSponsor,
  withSponsorAuth,
} from '@/features/auth';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

async function handler(req: NextApiRequestWithSponsor, res: NextApiResponse) {
  const userId = req.userId;

  const params = req.query;
  const slug = params.slug as string;
  const type = params.type as 'bounty' | 'project' | 'hackathon';

  logger.debug(`Request query: ${safeStringify(params)}`);

  try {
    const userSponsorId = req.userSponsorId;

    const result = await prisma.bounties.findFirst({
      where: {
        slug,
        type,
        isActive: true,
        sponsorId: userSponsorId,
      },
      include: {
        sponsor: { select: { name: true, logo: true, isVerified: true } },
        poc: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        Submission: true,
        Hackathon: {
          select: {
            altLogo: true,
            startDate: true,
            name: true,
            description: true,
            slug: true,
            announceDate: true,
          },
        },
      },
    });

    if (!result) {
      logger.warn(`Bounty with slug=${slug} not found for user ${userId}`);
      return res.status(404).json({
        message: `Bounty with slug=${slug} not found.`,
      });
    }

    const totalSubmissions = result.Submission.length;
    const winnersSelected = result.Submission.filter(
      (sub) => sub.isWinner,
    ).length;
    const paymentsMade = result.Submission.filter((sub) => sub.isPaid).length;

    const podiumWinnersSelected = result.Submission.filter(
      (submission) =>
        submission.isWinner &&
        submission.winnerPosition !== BONUS_REWARD_POSITION,
    ).length;

    const bonusWinnerSelected = result.Submission.filter(
      (sub) => sub.isWinner && sub.winnerPosition === BONUS_REWARD_POSITION,
    ).length;

    logger.info(`Successfully fetched bounty details for slug=${slug}`);
    return res.status(200).json({
      ...result,
      totalSubmissions,
      winnersSelected,
      paymentsMade,
      podiumWinnersSelected,
      bonusWinnerSelected,
    });
  } catch (error: any) {
    logger.error(
      `Error fetching bounty with slug=${slug}:`,
      safeStringify(error),
    );
    return res.status(400).json({
      error: error.message,
      message: `Error occurred while fetching bounty with slug=${slug}.`,
    });
  }
}

export default withSponsorAuth(handler);
