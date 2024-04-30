import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  try {
    const pows = await prisma.poW.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            photo: true,
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 15,
    });

    const submissions = await prisma.submission.findMany({
      include: {
        listing: {
          include: {
            sponsor: true,
          },
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
            photo: true,
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 15,
    });

    const modifiedSubmissions = submissions.map((submission) => {
      const isWinnersAnnounced = submission.listing.isWinnersAnnounced;
      return {
        ...submission,
        id: isWinnersAnnounced ? submission.id : null,
        link: isWinnersAnnounced ? submission.link : null,
        tweet: isWinnersAnnounced ? submission.tweet : null,
        eligibilityAnswers: isWinnersAnnounced
          ? submission.eligibilityAnswers
          : null,
        otherInfo: isWinnersAnnounced ? submission.otherInfo : null,
      };
    });

    const feedData = {
      PoW: pows,
      Submission: modifiedSubmissions,
    };

    return res.status(200).json(feedData);
  } catch (error: any) {
    console.log(error);
    return res
      .status(500)
      .json({ error: `Unable to fetch users: ${error.message}` });
  }
}
