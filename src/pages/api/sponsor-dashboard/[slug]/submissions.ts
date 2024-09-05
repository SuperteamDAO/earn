import type { NextApiResponse } from 'next';

import {
  type NextApiRequestWithSponsor,
  withSponsorAuth,
} from '@/features/auth';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';

async function handler(req: NextApiRequestWithSponsor, res: NextApiResponse) {
  const userId = req.userId;
  const params = req.query;

  const slug = params.slug as string;
  const isHackathon = params.isHackathon === 'true';

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId as string,
      },
    });

    if (!user) {
      logger.warn(`Unauthorized access attempt by user ${userId}`);
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const submissions = await prisma.submission.findMany({
      where: {
        listing: {
          slug,
          isActive: true,
          ...(isHackathon
            ? { hackathonId: user.hackathonId }
            : { sponsor: { id: req.userSponsorId } }),
        },
        isActive: true,
        isArchived: false,
      },
      include: {
        user: {
          select: {
            id: true,
            photo: true,
            firstName: true,
            lastName: true,
            username: true,
            email: true,
            publicKey: true,
            twitter: true,
            discord: true,
          },
        },
        listing: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const submissionsWithSortKey = submissions.map((submission) => {
      let sortKey = 0;
      if (submission.isWinner) {
        sortKey = Number(submission.winnerPosition);
      } else {
        switch (submission.label) {
          case 'Unreviewed':
            sortKey = 400;
            break;
          case 'Shortlisted':
            sortKey = 200;
            break;
          case 'Reviewed':
            sortKey = submission.listing?.isWinnersAnnounced ? 300 : 600;
            break;
          case 'Spam':
            sortKey = 1000;
            break;
        }
      }

      return { submission, sortKey };
    });

    submissionsWithSortKey.sort((a, b) => a.sortKey - b.sortKey);

    const sortedSubmissions = submissionsWithSortKey.map(
      (item) => item.submission,
    );

    logger.info(
      `Fetched ${sortedSubmissions.length} submissions for slug ${slug}`,
    );
    return res.status(200).json(sortedSubmissions);
  } catch (error: any) {
    logger.error(
      `Error occurred while fetching submissions for slug=${slug}: ${error.message}`,
    );
    return res.status(500).json({
      error: error.message,
      message: `Error occurred while fetching submissions with slug=${slug}.`,
    });
  }
}

export default withSponsorAuth(handler);
