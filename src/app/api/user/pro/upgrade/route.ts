import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { userSelectOptions } from '@/features/auth/constants/userSelectOptions';
import { getUserSession } from '@/features/auth/utils/getUserSession';

export async function POST() {
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
        listingWinnings: number;
        grantWinnings: number;
        totalWinnings: number;
      }>
    >`
      SELECT 
        COALESCE(submission_stats.listing_winnings, 0) as listingWinnings,
        COALESCE(grant_stats.grant_winnings, 0) as grantWinnings,
        COALESCE(submission_stats.listing_winnings, 0) + COALESCE(grant_stats.grant_winnings, 0) as totalWinnings
      FROM User u
      LEFT JOIN (
        SELECT 
          s.userId,
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

    const totalWinnings = stats[0].totalWinnings;

    if (totalWinnings < 1000) {
      logger.warn(
        `User ${userId} attempted to upgrade to pro but only earned $${totalWinnings}`,
      );
      return NextResponse.json(
        {
          error: 'Not eligible for Pro',
          message: `You need to earn at least $1,000 to upgrade to Pro. You've earned $${totalWinnings.toFixed(2)}.`,
        },
        { status: 403 },
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { isPro: true },
    });

    if (existingUser?.isPro) {
      logger.info(`User ${userId} is already Pro`);
      const updatedUser = await prisma.user.findUnique({
        where: { id: userId },
        select: userSelectOptions,
      });
      return NextResponse.json(updatedUser);
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isPro: true },
    });

    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      select: userSelectOptions,
    });

    logger.info(`User ${userId} successfully upgraded to Pro`);

    return NextResponse.json(updatedUser);
  } catch (err) {
    logger.error(
      `Error occurred while upgrading user to Pro: ${safeStringify(err)}`,
    );
    return NextResponse.json(
      { error: 'Error occurred while upgrading to Pro.' },
      { status: 500 },
    );
  }
}
