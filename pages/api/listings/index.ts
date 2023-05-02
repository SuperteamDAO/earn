import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function user(_req: NextApiRequest, res: NextApiResponse) {
  // const params = req.query;
  // console.log('file: index.ts:7 ~ user ~ params:', params);
  try {
    const bounties = await prisma.bounties.findMany({
      where: {
        isActive: true,
        isArchived: false,
      },
      take: 5,
      orderBy: {
        deadline: 'asc',
      },
      include: {
        sponsor: {
          select: {
            name: true,
            slug: true,
            logo: true,
          },
        },
      },
    });
    console.log('file: index.ts:28 ~ user ~ bounties:', bounties);

    const grants = await prisma.grants.findMany({
      where: {
        isActive: true,
        isArchived: false,
      },
      take: 5,
      orderBy: {
        updatedAt: 'desc',
      },
      select: {
        title: true,
        slug: true,
        shortDescription: true,
        token: true,
        rewardAmount: true,
        sponsor: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
          },
        },
      },
    });
    console.log('file: index.ts:48 ~ user ~ grants:', grants);
    res.status(200).json({ bounties, grants });
  } catch (error) {
    console.log('file: index.ts:58 ~ user ~ error:', error);
    res.status(400).json({
      error,
      message: 'Error occurred while fetching listings',
    });
  }
}
