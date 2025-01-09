import type { NextApiResponse } from 'next';

import { Superteams } from '@/constants/Superteam';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithSponsor } from '@/features/auth/types';
import { withSponsorAuth } from '@/features/auth/utils/withSponsorAuth';

async function handler(req: NextApiRequestWithSponsor, res: NextApiResponse) {
  const { page = '1', limit = '10', ...params } = req.query;
  const sponsorId = req.userSponsorId;
  const userId = req.userId;

  const pageNumber = parseInt(page as string, 10);
  const limitNumber = parseInt(limit as string, 10);
  const skip = (pageNumber - 1) * limitNumber;

  logger.debug(`Query params: ${safeStringify({ page, limit, ...params })}`);

  try {
    logger.debug(`Fetching stLead value of user with ${userId}`);
    const user = await prisma.user.findUnique({
      where: { id: userId as string },
      select: { stLead: true },
    });

    logger.debug(`ST Lead value of user ${userId} is ${user?.stLead}`, {
      userId,
      ...user,
    });

    logger.debug(`Fetching sponsor name of user ${userId}`);
    const sponsor = await prisma.sponsors.findUnique({
      where: { id: sponsorId },
      select: { name: true },
    });
    logger.debug(`Sponsor Name of user ${userId} is ${sponsor?.name}`, {
      sponsorId,
      ...sponsor,
    });

    const superteam = Superteams.find(
      (team) =>
        team.name.trim().toLowerCase().normalize() ===
        sponsor?.name.trim().toLowerCase().normalize(),
    );
    if (!superteam) {
      logger.warn(
        `Invalid sponsor used for local profiles by userId ${userId} and sponsorId ${sponsorId}`,
      );
      return res.status(403).json({ error: 'Invalid sponsor' });
    }

    logger.debug(
      `Superteam of sponsor ${sponsor?.name} of user ${userId} is found`,
      {
        superteam,
      },
    );

    const region = superteam.region;
    const countries = superteam.country;

    const isLocalProfileVisible =
      user?.stLead === region || user?.stLead === 'MAHADEV';

    if (!isLocalProfileVisible) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    logger.debug('Fetching user details');

    const totalCount = await prisma.user.count({
      where: { location: { in: countries } },
    });

    const users = await prisma.user.findMany({
      where: { location: { in: countries } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        skills: true,
        telegram: true,
        twitter: true,
        website: true,
        discord: true,
        username: true,
        photo: true,
        bio: true,
        community: true,
        interests: true,
        createdAt: true,
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
      skip,
      take: limitNumber,
      orderBy: {
        createdAt: 'desc',
      },
    });

    const processedUsers = users.map((user) => {
      const totalSubmissions = user.Submission.length;
      const wins = user.Submission.filter(
        (s) => s.isWinner && s.listing.isWinnersAnnounced,
      ).length;

      const listingWinnings = user.Submission.filter(
        (s) => s.isWinner && s.listing.isWinnersAnnounced,
      ).reduce((sum, submission) => sum + (submission.rewardInUSD || 0), 0);

      const grantWinnings = user.GrantApplication.filter(
        (g) => g.applicationStatus === 'Approved',
      ).reduce(
        (sum, application) => sum + (application.approvedAmountInUSD || 0),
        0,
      );

      const totalEarnings = listingWinnings + grantWinnings;

      return { ...user, totalSubmissions, wins, totalEarnings };
    });

    const rankedUsers = processedUsers
      .sort((a, b) => b.totalEarnings - a.totalEarnings)
      .map((user, index) => ({
        ...user,
        rank: skip + index + 1,
      }));

    logger.info('Successfully fetched and processed user details');
    res.status(200).json({
      users: rankedUsers,
      pagination: {
        total: totalCount,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(totalCount / limitNumber),
      },
    });
  } catch (err: any) {
    logger.error(`Error fetching and processing users: ${safeStringify(err)}`);
    res.status(400).json({ error: 'Error occurred while fetching users.' });
  }
}

export default withSponsorAuth(handler);
