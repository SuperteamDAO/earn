import dayjs from 'dayjs';
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
      const isDeadlinePast = dayjs().isAfter(
        dayjs(submission.listing.deadline),
      );
      return {
        ...submission,
        id: isDeadlinePast ? submission.id : null,
        link: isDeadlinePast ? submission.link : null,
        tweet: isDeadlinePast ? submission.tweet : null,
        eligibilityAnswers: isDeadlinePast
          ? submission.eligibilityAnswers
          : null,
        otherInfo: isDeadlinePast ? submission.otherInfo : null,
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
