import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

type WinnerPosition = 'first' | 'second' | 'third' | 'fourth' | 'fifth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const params = req.query;

  const slug = params.slug as string;
  const skip = params.take ? parseInt(params.skip as string, 10) : 0;
  const take = params.take ? parseInt(params.take as string, 10) : 15;

  const searchText = params.searchText as string;

  const whereSearch = searchText
    ? {
        OR: [
          {
            user: {
              firstName: {
                contains: searchText,
              },
            },
          },
          {
            user: {
              email: {
                contains: searchText,
              },
            },
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
    if (positionKey in positionMap) {
      return positionMap[positionKey];
    } else {
      return 999;
    }
  };

  try {
    const submissions = await prisma.submission.findMany({
      where: {
        listing: {
          slug,
          isActive: true,
        },
        isActive: true,
        isArchived: false,
        ...whereSearch,
      },
      include: {
        user: true,
        listing: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (!submissions) {
      return res.status(404).json({
        message: `Submissions with slug=${slug} not found.`,
      });
    }

    const submissionsWithSortKey = submissions.map((submission) => {
      let sortKey = 0;
      if (submission.isWinner) {
        const positionValue = mapPositionToNumber(
          submission.winnerPosition as string,
        );
        sortKey = positionValue;
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

    return res.status(200).json(paginatedSubmissions);
  } catch (error) {
    return res.status(400).json({
      error,
      message: `Error occurred while fetching submissions with slug=${slug}.`,
    });
  }
}
