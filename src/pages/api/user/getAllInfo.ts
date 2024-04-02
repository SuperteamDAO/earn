import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function getAllUsers(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { ...req.body },
      include: {
        Submission: {
          include: {
            listing: {
              include: {
                sponsor: true,
              },
            },
          },
        },
        PoW: true,
      },
    });

    if (!user) {
      return res.status(500).json({ error: 'Unable to fetch users' });
    }

    const modifiedSubmissions = user.Submission.map((submission) => {
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

    const modifiedUser = {
      ...user,
      Submission: modifiedSubmissions,
    };

    return res.status(200).json(modifiedUser);
  } catch (error: any) {
    console.log(error);
    return res
      .status(500)
      .json({ error: `Unable to fetch users: ${error.message}` });
  }
}
