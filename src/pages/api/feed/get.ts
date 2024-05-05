import { type NextApiRequest, type NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  try {
    const powAndSubmissions = await prisma.$queryRaw<any[]>`
      (SELECT 
        CASE WHEN l.isWinnersAnnounced THEN sub.id ELSE NULL END as id,
        sub.createdAt, sub.like, sub.likes,
        CASE WHEN l.isWinnersAnnounced THEN sub.link ELSE NULL END as link,
        CASE WHEN l.isWinnersAnnounced THEN sub.tweet ELSE NULL END as tweet,
        CASE WHEN l.isWinnersAnnounced THEN sub.eligibilityAnswers ELSE NULL END as eligibilityAnswers,
        CASE WHEN l.isWinnersAnnounced THEN sub.otherInfo ELSE NULL END as otherInfo,
        sub.isWinner, sub.winnerPosition,
        NULL as description,
        u.firstName, u.lastName, u.photo, u.username,
        l.id as listingId, l.sponsorId, l.title as listingTitle, l.rewards, l.type as listingType, l.slug as listingSlug, l.isWinnersAnnounced, l.token,
        s.name as sponsorName, s.logo as sponsorLogo,
        'Submission' as type
      FROM 
        Submission as sub
      JOIN 
        User as u ON sub.userId = u.id
      JOIN 
        Bounties as l ON sub.listingId = l.id
      JOIN 
        Sponsors as s ON l.sponsorId = s.id)
      UNION ALL
      (SELECT 
        pow.id, pow.createdAt, pow.like, pow.likes, pow.link, NULL as tweet, NULL as eligibilityAnswers, NULL as otherInfo, NULL as isWinner, NULL as winnerPosition,
        pow.description,
        u.firstName, u.lastName, u.photo, u.username,
        NULL as listingId, NULL as sponsorId, NULL as listingTitle, NULL as rewards, NULL as listingType, NULL as listingSlug, NULL as isWinnersAnnounced, NULL as token,
        NULL as sponsorName, NULL as sponsorLogo,
        'PoW' as type
      FROM 
        PoW as pow
      JOIN 
        User as u ON pow.userId = u.id)
      ORDER BY 
        createdAt DESC
      LIMIT 15
    `;

    return res.status(200).json(powAndSubmissions);
  } catch (error: any) {
    console.log(error);
    return res
      .status(500)
      .json({ error: `Unable to fetch data: ${error.message}` });
  }
}
