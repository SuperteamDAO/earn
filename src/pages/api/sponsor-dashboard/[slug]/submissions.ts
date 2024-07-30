import type { NextApiResponse } from 'next';

import {
  type NextApiRequestWithSponsor,
  withSponsorAuth,
} from '@/features/auth';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';

type WinnerPosition = 'first' | 'second' | 'third' | 'fourth' | 'fifth';

async function handler(req: NextApiRequestWithSponsor, res: NextApiResponse) {
  const userId = req.userId;
  const params = req.query;

  const slug = params.slug as string;
  const skip = params.skip ? parseInt(params.skip as string, 10) : 0;
  const take = params.take ? parseInt(params.take as string, 10) : 15;
  const isHackathon = params.isHackathon === 'true';
  const searchText = params.searchText as string;

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

    const whereSearch = searchText
      ? {
          OR: [
            { user: { firstName: { contains: searchText } } },
            { user: { email: { contains: searchText } } },
            { user: { username: { contains: searchText } } },
            { user: { twitter: { contains: searchText } } },
            { user: { discord: { contains: searchText } } },
            { link: { contains: searchText } },
            {
              AND: [
                {
                  user: { firstName: { contains: searchText.split(' ')[0] } },
                },
                {
                  user: {
                    lastName: { contains: searchText.split(' ')[1] || '' },
                  },
                },
              ],
            },
          ],
        }
      : {};

    const mapPositionToNumber = (position: string) => {
      const positionMap: { [key in WinnerPosition]: number } = {
        first: 1,
        second: 2,
        third: 3,
        fourth: 4,
        fifth: 5,
      };

      const positionKey = position.toLowerCase() as WinnerPosition;
      return positionMap[positionKey] ?? 999;
    };

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
        ...whereSearch,
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
        sortKey = mapPositionToNumber(submission.winnerPosition as string);
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

    const paginatedSubmissions = sortedSubmissions.slice(skip, skip + take);

    logger.info(
      `Fetched ${paginatedSubmissions.length} submissions for slug ${slug}`,
    );
    return res.status(200).json(paginatedSubmissions);
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
