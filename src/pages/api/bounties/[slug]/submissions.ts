import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

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
        user: {
          firstName: {
            contains: searchText,
          },
        },
      }
    : {};

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
      },
      orderBy: { createdAt: 'asc' },
      skip,
      take,
    });

    if (!submissions) {
      return res.status(404).json({
        message: `Submissions with slug=${slug} not found.`,
      });
    }

    const submissionsWithSortKey = submissions.map((submission) => ({
      submission,
      sortKey:
        submission.label === 'Unreviewed'
          ? 1
          : submission.isWinner === true
            ? 2
            : submission.label === 'Shortlisted'
              ? 3
              : submission.label === 'Reviewed'
                ? 4
                : submission.label === 'Spam'
                  ? 5
                  : 6,
    }));

    submissionsWithSortKey.sort((a, b) => a.sortKey - b.sortKey);

    const sortedSubmissions = submissionsWithSortKey.map(
      (item) => item.submission,
    );

    return res.status(200).json(sortedSubmissions);
  } catch (error) {
    return res.status(400).json({
      error,
      message: `Error occurred while fetching submissions with slug=${slug}.`,
    });
  }
}
