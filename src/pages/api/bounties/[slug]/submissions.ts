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
      orderBy: { updatedAt: 'desc' },
      skip,
      take,
    });

    if (!submissions) {
      return res.status(404).json({
        message: `submissions with slug=${slug} not found.`,
      });
    }

    return res.status(200).json(submissions);
  } catch (error) {
    return res.status(400).json({
      error,
      message: `Error occurred while fetching bounty with slug=${slug}.`,
    });
  }
}
