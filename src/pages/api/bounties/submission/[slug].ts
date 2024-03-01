import { type Submission } from '@prisma/client';
import moment from 'moment';
import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function user(req: NextApiRequest, res: NextApiResponse) {
  const params = req.query;

  const slug = params.slug as string;
  try {
    const result = await prisma.bounties.findFirst({
      where: {
        slug,
        isActive: true,
      },
      include: {
        sponsor: true,
        poc: true,
        Hackathon: {
          select: {
            altLogo: true,
          },
        },
      },
    });

    if (Number(moment(result?.deadline).format('x')) > Date.now()) {
      res.status(200).json({
        bounty: result,
        submission: [],
      });
      return;
    }

    const submission = await prisma.submission.findMany({
      where: {
        listingType: 'BOUNTY',
        listingId: result?.id,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            photo: true,
            username: true,
          },
        },
      },
    });

    const sortSubmissions = (a: Submission, b: Submission) => {
      const order = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5 };

      const aPosition = a.winnerPosition as keyof typeof order;
      const bPosition = b.winnerPosition as keyof typeof order;

      if (a.winnerPosition && b.winnerPosition) {
        return (
          (order[aPosition] || Number.MAX_VALUE) -
          (order[bPosition] || Number.MAX_VALUE)
        );
      }

      if (a.winnerPosition && !b.winnerPosition) {
        return -1;
      }

      if (!a.winnerPosition && b.winnerPosition) {
        return 1;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    };

    submission.sort(sortSubmissions);

    res.status(200).json({
      bounty: result,
      submission,
    });
  } catch (error) {
    res.status(400).json({
      error,
      message: `Error occurred while fetching bounty with slug=${slug}.`,
    });
  }
}
