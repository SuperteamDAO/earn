import type { NextApiResponse } from 'next';

import { Superteams } from '@/constants/Superteam';
import {
  type NextApiRequestWithSponsor,
  withSponsorAuth,
} from '@/features/auth';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

async function handler(req: NextApiRequestWithSponsor, res: NextApiResponse) {
  const params = req.query;
  const sponsorId = req.userSponsorId;
  const userId = req.userId;

  logger.debug(`Query params: ${safeStringify(params)}`);

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId as string },
      select: { stLead: true },
    });

    const sponsor = await prisma.sponsors.findUnique({
      where: { id: sponsorId },
      select: { name: true },
    });

    const superteam = Superteams.find((team) => team.name === sponsor?.name);
    if (!superteam) {
      return res.status(401).json({ error: 'Invalid sponsor' });
    }

    const region = superteam.region;
    const countries = superteam.country;

    const isLocalProfileVisible =
      user?.stLead === region || user?.stLead === 'MAHADEV';

    if (!isLocalProfileVisible) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    logger.debug('Fetching user details');
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
        rank: index + 1,
      }));

    logger.info('Successfully fetched and processed user details');
    res.status(200).json(rankedUsers);
  } catch (err: any) {
    logger.error(`Error fetching and processing users: ${safeStringify(err)}`);
    res.status(400).json({ error: 'Error occurred while fetching users.' });
  }
}

export default withSponsorAuth(handler);
