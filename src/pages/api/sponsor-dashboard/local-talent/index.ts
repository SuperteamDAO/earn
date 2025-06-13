import type { NextApiResponse } from 'next';

import { Superteams, unofficialSuperteams } from '@/constants/Superteam';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithSponsor } from '@/features/auth/types';
import { withSponsorAuth } from '@/features/auth/utils/withSponsorAuth';

async function handler(req: NextApiRequestWithSponsor, res: NextApiResponse) {
  const { page = '1', limit = '10', ...params } = req.query;
  const currentSponsorId = req.userSponsorId;
  const currentUserId = req.userId;

  const pageNumber = parseInt(page as string, 10);
  const pageSize = parseInt(limit as string, 10);
  const skip = (pageNumber - 1) * pageSize;

  logger.debug(`Query params: ${safeStringify({ page, limit, ...params })}`);

  try {
    logger.debug(`Fetching stLead value of user with ${currentUserId}`);
    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId as string },
      select: { stLead: true },
    });

    logger.debug(
      `ST Lead value of user ${currentUserId} is ${currentUser?.stLead}`,
      {
        currentUserId,
        ...currentUser,
      },
    );

    logger.debug(`Fetching sponsor name of user ${currentUserId}`);
    const sponsorDetails = await prisma.sponsors.findUnique({
      where: { id: currentSponsorId },
      select: { name: true },
    });

    logger.debug(
      `Sponsor Name of user ${currentUserId} is ${sponsorDetails?.name}`,
      {
        currentSponsorId,
        ...sponsorDetails,
      },
    );

    const matchedSuperteam =
      Superteams.find(
        (team) =>
          team.name.toLowerCase() === sponsorDetails?.name.toLowerCase(),
      ) ||
      unofficialSuperteams.find(
        (team) =>
          team.name.toLowerCase() === sponsorDetails?.name.toLowerCase(),
      );

    logger.debug(`Matched superteam: ${matchedSuperteam?.name}`);

    if (!matchedSuperteam) {
      logger.warn(
        `Invalid sponsor used for local profiles by userId ${currentUserId} and sponsorId ${currentSponsorId}`,
      );
      return res.status(403).json({ error: 'Invalid sponsor' });
    }

    logger.debug(
      `Superteam of sponsor ${sponsorDetails?.name} of user ${currentUserId} is found`,
      {
        matchedSuperteam,
      },
    );

    const superteamRegion = matchedSuperteam.region;
    const superteamCountries = matchedSuperteam.country;

    const hasLocalProfileAccess =
      currentUser?.stLead === superteamRegion ||
      currentUser?.stLead === 'MAHADEV';

    logger.debug(`Has local profile access: ${hasLocalProfileAccess}`);

    if (!hasLocalProfileAccess) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    logger.debug('Fetching user details');

    const totalCount = await prisma.user.count({
      where: { location: { in: superteamCountries } },
    });

    const localProfiles = await prisma.user.findMany({
      where: { location: { in: superteamCountries } },
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
      take: pageSize,
      orderBy: {
        createdAt: 'desc',
      },
    });

    const enrichedProfiles = localProfiles.map((profile) => {
      const submissionCount = profile.Submission.length;
      const winCount = profile.Submission.filter(
        (s) => s.isWinner && s.listing.isWinnersAnnounced,
      ).length;

      const listingEarnings = profile.Submission.filter(
        (s) => s.isWinner && s.listing.isWinnersAnnounced,
      ).reduce((sum, submission) => sum + (submission.rewardInUSD || 0), 0);

      const grantEarnings = profile.GrantApplication.filter(
        (g) =>
          g.applicationStatus === 'Approved' ||
          g.applicationStatus === 'Completed',
      ).reduce(
        (sum, application) => sum + (application.approvedAmountInUSD || 0),
        0,
      );

      const totalEarnings = listingEarnings + grantEarnings;

      return { ...profile, submissionCount, winCount, totalEarnings };
    });

    const rankedProfiles = enrichedProfiles
      .sort((a, b) => b.totalEarnings - a.totalEarnings)
      .map((profile, index) => ({
        ...profile,
        rank: skip + index + 1,
      }));

    logger.info('Successfully fetched and processed user details');
    res.status(200).json({
      users: rankedProfiles,
      pagination: {
        total: totalCount,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (err: any) {
    logger.error(`Error fetching and processing users: ${safeStringify(err)}`);
    res.status(400).json({ error: 'Error occurred while fetching users.' });
  }
}

export default withSponsorAuth(handler);
