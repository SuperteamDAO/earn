import type { NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithSponsor } from '@/features/auth/types';
import { withSponsorAuth } from '@/features/auth/utils/withSponsorAuth';

declare global {
  interface BigInt {
    toJSON(): string;
  }
}

BigInt.prototype.toJSON = function () {
  return String(this);
};

async function handler(req: NextApiRequestWithSponsor, res: NextApiResponse) {
  const params = req.query;
  const userId = req.userId;

  logger.debug(`Query params: ${safeStringify(params)}`);

  const superteamRegion = params.superteamRegion as string;
  const superteamCountriesParam = params.superteamCountries as
    | string
    | string[];

  let superteamCountries: string[];
  if (typeof superteamCountriesParam === 'string') {
    superteamCountries = superteamCountriesParam.includes(',')
      ? superteamCountriesParam.split(',').map((c) => c.trim())
      : [superteamCountriesParam];
  } else if (Array.isArray(superteamCountriesParam)) {
    superteamCountries = superteamCountriesParam;
  } else {
    superteamCountries = [];
  }

  if (!superteamRegion || !superteamCountries.length) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    const requestingUser = await prisma.user.findUnique({
      where: { id: userId as string },
      select: { stLead: true },
    });

    const leadRegion = requestingUser?.stLead;

    if (
      leadRegion?.toLowerCase() !== superteamRegion.toLowerCase() &&
      leadRegion !== 'MAHADEV'
    ) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    logger.debug('Fetching user details with optimized query');

    const rankedTalent = await prisma.$queryRaw<
      Array<{
        id: string;
        firstName: string | null;
        lastName: string | null;
        email: string;
        skills: any;
        telegram: string | null;
        twitter: string | null;
        website: string | null;
        discord: string | null;
        username: string | null;
        photo: string | null;
        bio: string | null;
        community: any;
        interests: any;
        createdAt: Date;
        totalSubmissions: number;
        wins: number;
        totalEarnings: number;
        rank: number;
      }>
    >`
      WITH user_stats AS (
        SELECT 
          u.id,
          u.firstName,
          u.lastName,
          u.email,
          u.skills,
          u.telegram,
          u.twitter,
          u.website,
          u.discord,
          u.username,
          u.photo,
          u.bio,
          u.community,
          u.interests,
          u.createdAt,
          COALESCE(submission_stats.total_submissions, 0) as totalSubmissions,
          COALESCE(submission_stats.wins, 0) as wins,
          COALESCE(submission_stats.listing_winnings, 0) + COALESCE(grant_stats.grant_winnings, 0) as totalEarnings
        FROM User u
        LEFT JOIN (
          SELECT 
            s.userId,
            COUNT(*) as total_submissions,
            COUNT(CASE WHEN s.isWinner = true AND l.isWinnersAnnounced = true THEN 1 END) as wins,
            COALESCE(SUM(CASE WHEN s.isWinner = true AND l.isWinnersAnnounced = true THEN s.rewardInUSD ELSE 0 END), 0) as listing_winnings
          FROM Submission s
          INNER JOIN Bounties l ON s.listingId = l.id
          GROUP BY s.userId
        ) submission_stats ON u.id = submission_stats.userId
        LEFT JOIN (
          SELECT 
            ga.userId,
            COALESCE(SUM(CASE WHEN ga.applicationStatus = 'Approved' THEN ga.approvedAmountInUSD ELSE 0 END), 0) as grant_winnings
          FROM GrantApplication ga
          GROUP BY ga.userId
        ) grant_stats ON u.id = grant_stats.userId
        WHERE u.location IN (${superteamCountries})
      )
      SELECT 
        *,
        ROW_NUMBER() OVER (ORDER BY totalEarnings DESC, wins DESC, totalSubmissions DESC) as \`rank\`
      FROM user_stats
      ORDER BY totalEarnings DESC, wins DESC, totalSubmissions DESC
    `;

    logger.info('Successfully fetched and processed user details');
    res.status(200).json(rankedTalent);
  } catch (error: any) {
    logger.error(
      `Error fetching and processing users: ${safeStringify(error)}`,
    );
    res.status(400).json({
      error: 'Error occurred while fetching users.',
      details: error.message,
    });
  }
}

export default withSponsorAuth(handler);
