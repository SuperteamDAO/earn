import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { getUserSession } from '@/features/auth/utils/getUserSession';

export async function GET() {
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

    const stats = await prisma.$queryRaw<
      Array<{
        participations: bigint;
        wins: bigint;
        listingWinnings: number;
        grantWinnings: number;
        totalWinnings: number;
      }>
    >`
      SELECT 
        COALESCE(submission_stats.total_submissions, 0) as participations,
        COALESCE(submission_stats.wins, 0) as wins,
        COALESCE(submission_stats.listing_winnings, 0) as listingWinnings,
        COALESCE(grant_stats.grant_winnings, 0) as grantWinnings,
        COALESCE(submission_stats.listing_winnings, 0) + COALESCE(grant_stats.grant_winnings, 0) as totalWinnings
      FROM User u
      LEFT JOIN (
        SELECT 
          s.userId,
          COUNT(*) as total_submissions,
          COUNT(CASE WHEN s.isWinner = true AND l.isWinnersAnnounced = true THEN 1 END) as wins,
          COALESCE(SUM(CASE WHEN s.isWinner = true AND l.isWinnersAnnounced = true THEN s.rewardInUSD ELSE 0 END), 0) as listing_winnings
        FROM Submission s
        INNER JOIN Bounties l ON s.listingId = l.id
        WHERE s.userId = ${userId}
        GROUP BY s.userId
      ) submission_stats ON u.id = submission_stats.userId
      LEFT JOIN (
        SELECT 
          ga.userId,
          COALESCE(SUM(CASE WHEN ga.applicationStatus IN ('Approved', 'Completed') THEN ga.approvedAmountInUSD ELSE 0 END), 0) as grant_winnings
        FROM GrantApplication ga
        WHERE ga.userId = ${userId}
        GROUP BY ga.userId
      ) grant_stats ON u.id = grant_stats.userId
      WHERE u.id = ${userId}
    `;

    if (!stats || stats.length === 0 || !stats[0]) {
      logger.warn(`User not found for id: ${userId}`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const result = stats[0];
    const participations = Number(result.participations);
    const wins = Number(result.wins);
    const totalWinnings = result.totalWinnings;

    logger.info(
      `User data retrieved successfully: participations=${participations}, wins=${wins}, totalWinnings=${totalWinnings}`,
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
