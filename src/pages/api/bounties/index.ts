import { status } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

import { prisma } from '@/prisma';

export default async function bounties(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const token = await getToken({ req });

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = token.id;

  if (!userId) {
    return res.status(400).json({ error: 'Invalid token' });
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId as string,
    },
  });

  if (!user || !user.currentSponsorId) {
    return res
      .status(403)
      .json({ error: 'User does not have a current sponsor.' });
  }

  const params = req.query;
  const sponsorId = user.currentSponsorId;
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
        status: status.OPEN,
      },
    };
    const total = await prisma.bounties.count(countQuery);
    const result = await prisma.bounties.findMany({
      ...countQuery,
      skip: skip ?? 0,
      take: take ?? 15,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
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
        type: true,
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
        applicationType: true,
      },
    });
    res.status(200).json({ total, data: result });
  } catch (err) {
    res.status(400).json({ err: 'Error occurred while fetching bounties.' });
  }
}
