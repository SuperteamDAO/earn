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

    const bounty = await prisma.bounties.findFirst({
      where: {
        slug,
        type,
        isActive: true,
        sponsorId: userSponsorId,
      },
      select: { id: true },
    });

    if (!bounty) {
      logger.warn(`Bounty with slug=${slug} not found for user ${userId}`);
      return res.status(404).json({
        message: `Bounty with slug=${slug} not found.`,
      });
    }

    const submissions = await prisma.submission.findMany({
      where: {
        listingId: bounty.id,
      },
    });

    const totalSubmissions = submissions.length;
    const winnersSelected = submissions.filter((sub) => sub.isWinner).length;
    const paymentsMade = submissions.filter((sub) => sub.isPaid).length;
    const podiumWinnersSelected = submissions.filter(
      (submission) =>
        submission.isWinner &&
        submission.winnerPosition !== BONUS_REWARD_POSITION,
    ).length;
    const bonusWinnerSelected = submissions.filter(
      (sub) => sub.isWinner && sub.winnerPosition === BONUS_REWARD_POSITION,
    ).length;

    logger.info(`Successfully fetched submission stats for slug=${slug}`);
    return res.status(200).json({
      totalSubmissions,
      winnersSelected,
      paymentsMade,
      podiumWinnersSelected,
      bonusWinnerSelected,
    });
  } catch (error: any) {
    logger.error(
      `Error fetching submission stats with slug=${slug}:`,
      safeStringify(error),
    );
    return res.status(400).json({
      error: error.message,
      message: `Error occurred while fetching submission stats with slug=${slug}.`,
    });
  }
}

export default withSponsorAuth(handler);
