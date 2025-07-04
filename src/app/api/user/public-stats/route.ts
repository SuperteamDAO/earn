import { type NextRequest, NextResponse } from 'next/server';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    logger.info(`Request body: ${safeStringify(body)}`);

    const { username } = body;

    const result = await prisma.user.findUnique({
      where: { username },
      select: {
        Submission: {
          select: {
            isWinner: true,
            rewardInUSD: true,
            listing: { select: { isWinnersAnnounced: true } },
          },
        },
        GrantApplication: {
          select: { approvedAmountInUSD: true, applicationStatus: true },
        },
      },
    });

    if (!result) {
      logger.warn(`User not found for username: ${username}`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
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

    return NextResponse.json({ participations, wins, totalWinnings });
  } catch (err) {
    logger.error(
      `Error occurred while processing the request: ${safeStringify(err)}`,
    );
    return NextResponse.json(
      { error: 'Error occurred while processing the request.' },
      { status: 500 },
    );
  }
}
