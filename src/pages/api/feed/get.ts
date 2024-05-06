import dayjs from 'dayjs';
import { type NextApiRequest, type NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  try {
    const { filter, timePeriod } = req.query;
    const orderByColumn =
      filter === 'popular'
        ? 'likeCount DESC, createdAt DESC'
        : 'createdAt DESC';

    let startDate: string;
    let endDate: string;

    switch (timePeriod) {
      case 'today':
        startDate = dayjs().subtract(24, 'hour').format('YYYY-MM-DD');
        endDate = dayjs().format('YYYY-MM-DD');
        break;
      case 'this week':
        startDate = dayjs().subtract(7, 'day').format('YYYY-MM-DD');
        endDate = dayjs().format('YYYY-MM-DD');
        break;
      case 'this month':
        startDate = dayjs().subtract(30, 'day').format('YYYY-MM-DD');
        endDate = dayjs().format('YYYY-MM-DD');
        break;
      default:
        startDate = dayjs().subtract(30, 'day').format('YYYY-MM-DD');
        endDate = dayjs().format('YYYY-MM-DD');
        break;
    }

    const rawQuery = `
      (SELECT 
        CASE WHEN l.isWinnersAnnounced THEN sub.id ELSE NULL END as id,
        sub.createdAt, 
        JSON_LENGTH(sub.like) as likeCount, 
        sub.like,
        CASE WHEN l.isWinnersAnnounced THEN sub.link ELSE NULL END as link,
        CASE WHEN l.isWinnersAnnounced THEN sub.tweet ELSE NULL END as tweet,
        CASE WHEN l.isWinnersAnnounced THEN sub.eligibilityAnswers ELSE NULL END as eligibilityAnswers,
        CASE WHEN l.isWinnersAnnounced THEN sub.otherInfo ELSE NULL END as otherInfo,
        sub.isWinner, 
        sub.winnerPosition,
        NULL as description,
        u.firstName, 
        u.lastName, 
        u.photo, 
        u.username,
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
        WHERE DATE(sub.createdAt) BETWEEN '${startDate}' AND '${endDate}')
      UNION ALL
      (SELECT 
        pow.id, 
        pow.createdAt, 
        JSON_LENGTH(pow.like) as likeCount, 
        pow.like, 
        pow.link, 
        NULL as tweet, 
        NULL as eligibilityAnswers, 
        NULL as otherInfo, 
        NULL as isWinner, 
        NULL as winnerPosition,
        pow.description,
        u.firstName, 
        u.lastName, 
        u.photo, 
        u.username,
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
      WHERE DATE(pow.createdAt) BETWEEN '${startDate}' AND '${endDate}')    
      ORDER BY ${orderByColumn}
      LIMIT 15
    `;

    const powAndSubmissions = await prisma.$queryRawUnsafe(rawQuery);

    return res
      .status(200)
      .json(
        JSON.stringify(powAndSubmissions, (_key, value) =>
          typeof value === 'bigint' ? value.toString() : value,
        ),
      );
  } catch (error: any) {
    console.log(error);
    return res
      .status(500)
      .json({ error: `Unable to fetch data: ${error.message}` });
  }
}
