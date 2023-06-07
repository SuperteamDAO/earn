import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function bounties(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const params = req.query;
  const sponsorId = params.sponsorId as string;
  const searchText = params.searchText as string;
  const skip = params.take ? parseInt(params.skip as string, 10) : 0;
  const take = params.take ? parseInt(params.take as string, 10) : 15;
  const whereSearch = searchText
    ? {
        title: {
          contains: searchText,
        },
      }
    : {};
  try {
    const countQuery = {
      where: {
        isActive: true,
        isArchived: false,
        sponsorId,
        ...whereSearch,
      },
    };
    const total = await prisma.bounties.count(countQuery);
    const result = await prisma.bounties.findMany({
      ...countQuery,
      skip: skip ?? 0,
      take: take ?? 15,
      orderBy: [{ deadline: 'desc' }, { id: 'desc' }],
      select: {
        _count: {
          select: {
            Submission: {
              where: {
                isActive: true,
                isArchived: false,
              },
            },
          },
        },
        id: true,
        title: true,
        slug: true,
        token: true,
        status: true,
        deadline: true,
        isPublished: true,
        rewards: true,
        rewardAmount: true,
        totalWinnersSelected: true,
        totalPaymentsMade: true,
        isWinnersAnnounced: true,
      },
    });
    res.status(200).json({ total, data: result });
  } catch (err) {
    res.status(400).json({ err: 'Error occurred while fetching bounties.' });
  }
}
