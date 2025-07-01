import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { getUserSession } from '@/features/auth/utils/getUserSession';

export async function GET(_request: NextRequest) {
  try {
    const headersList = await headers();
    const sessionResponse = await getUserSession(headersList);

    if (sessionResponse.status !== 200 || !sessionResponse.data) {
      return NextResponse.json(
        { error: sessionResponse.error },
        { status: sessionResponse.status },
      );
    }

    const { userId } = sessionResponse.data;

    if (!userId) {
      logger.warn('Invalid token - No user id found');
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    const result = await prisma.user.findUnique({
      where: { id: userId },
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
      logger.warn(`User not found for id: ${userId}`);
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
