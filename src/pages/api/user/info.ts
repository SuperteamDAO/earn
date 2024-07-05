import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function getAllUsers(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { ...req.body },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = user.id;

    const powAndSubmissions = await prisma.$queryRaw<any[]>`
      (SELECT
        CASE 
          WHEN l.isWinnersAnnounced AND sub.isWinner THEN l.winnersAnnouncedAt 
          ELSE sub.createdAt 
        END as createdAt,
        CASE WHEN l.isWinnersAnnounced THEN sub.id ELSE NULL END as id, 
        sub.like, 
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
        pow.like, 
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
        'PoW' as type
      FROM
        PoW as pow
      JOIN
        User as u ON pow.userId = u.id
      WHERE
        pow.userId = ${userId})
      ORDER BY
        createdAt DESC
    `;

    return res.status(200).json({ ...user, feed: powAndSubmissions });
  } catch (error: any) {
    console.log(error);
    return res
      .status(500)
      .json({ error: `Unable to fetch user details: ${error.message}` });
  }
}
