import type { NextApiRequest, NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

export default async function getAllUsers(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  logger.info(`Request body: ${safeStringify(req.body)}`);

  const { username } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        twitter: true,
        linkedin: true,
        github: true,
        website: true,
        username: true,
        workPrefernce: true,
        firstName: true,
        lastName: true,
        skills: true,
        photo: true,
        email: true,
        currentEmployer: true,
        location: true,
      },
    });

    if (!user) {
      logger.warn(
        `User not found for the provided criteria: ${safeStringify(req.body)}`,
      );
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = user.id;
    logger.info(`User found: ${userId}`);

    let powAndSubmissionsAndGrants = await prisma.$queryRaw<any[]>`
      (SELECT
        CASE 
          WHEN l.isWinnersAnnounced AND sub.isWinner THEN COALESCE(l.winnersAnnouncedAt, sub.createdAt)
          ELSE sub.createdAt 
        END as createdAt,
        CASE WHEN l.isWinnersAnnounced THEN sub.id ELSE NULL END as id, 
        sub.like as likeData, 
        CASE WHEN l.isWinnersAnnounced THEN sub.link ELSE NULL END as link,
        CASE WHEN l.isWinnersAnnounced THEN sub.tweet ELSE NULL END as tweet,
        CASE WHEN l.isWinnersAnnounced THEN sub.eligibilityAnswers ELSE NULL END as eligibilityAnswers,
        CASE WHEN l.isWinnersAnnounced THEN sub.otherInfo ELSE NULL END as otherInfo,
        sub.isWinner, 
        sub.winnerPosition,
        NULL as description,
        NULL as title,
        u.firstName, 
        u.lastName, 
        u.photo,
        l.id as listingId, 
        l.sponsorId, 
        l.title as listingTitle, 
        l.rewards, 
        l.type as listingType, 
        l.slug as listingSlug, 
        l.isWinnersAnnounced, 
        l.token,
        s.name as sponsorName, 
        s.logo as sponsorLogo,
        NULL as grantApplicationAmount,
        'Submission' as type
      FROM
        Submission as sub
      JOIN
        User as u ON sub.userId = u.id
      JOIN
        Bounties as l ON sub.listingId = l.id
      JOIN
        Sponsors as s ON l.sponsorId = s.id
      WHERE
        sub.userId = ${userId})
      UNION ALL
      (SELECT
        pow.createdAt, 
        pow.id, 
        pow.like as likeData, 
        pow.link, 
        NULL as tweet, 
        NULL as eligibilityAnswers, 
        NULL as otherInfo, 
        NULL as isWinner, 
        NULL as winnerPosition,
        pow.description,
        pow.title,
        u.firstName, 
        u.lastName, 
        u.photo,
        NULL as listingId, 
        NULL as sponsorId, 
        NULL as listingTitle, 
        NULL as rewards, 
        NULL as listingType, 
        NULL as listingSlug, 
        NULL as isWinnersAnnounced, 
        NULL as token,
        NULL as sponsorName, 
        NULL as sponsorLogo,
        NULL as grantApplicationAmount,
        'PoW' as type
      FROM
        PoW as pow
      JOIN
        User as u ON pow.userId = u.id
      WHERE
        pow.userId = ${userId})
      UNION ALL
      (SELECT
        ga.decidedAt as createdAt,
        ga.id,
        NULL as likeData,
        NULL as title,
        NULL as link,
        NULL as tweet,
        NULL as eligibilityAnswers,
        NULL as otherInfo,
        NULL as isWinner,
        NULL as winnerPosition,
        NULL as description,
        u.firstName,
        u.lastName,
        u.photo,
        g.id as listingId,
        g.sponsorId,
        g.title as listingTitle,
        NULL as rewards,
        NULL as listingType,
        g.slug as listingSlug,
        NULL as isWinnersAnnounced,
        g.token as token,
        s.name as sponsorName,
        s.logo as sponsorLogo,
        ga.approvedAmount as grantApplicationAmount,
        'Grant' as type
      FROM
        GrantApplication as ga
      JOIN
        User as u ON ga.userId = u.id
      JOIN
        Grants as g ON ga.grantId = g.id
      JOIN
        Sponsors as s ON g.sponsorId = s.id
      WHERE
        ga.userId = ${userId} AND ga.applicationStatus = 'Approved')
      ORDER BY
        createdAt DESC
    `;

    powAndSubmissionsAndGrants = powAndSubmissionsAndGrants.map((item) => {
      const { likeData, ...rest } = item;
      return { ...rest, like: likeData };
    });

    logger.info(`User feed data retrieved successfully for user ID: ${userId}`);
    return res.status(200).json({ ...user, feed: powAndSubmissionsAndGrants });
  } catch (error: any) {
    logger.error(`Error fetching user details: ${safeStringify(error)}`);
    return res
      .status(500)
      .json({ error: `Unable to fetch user details: ${error.message}` });
  }
}
