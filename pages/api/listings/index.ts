import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';
import { dayjs } from '@/utils/dayjs';

export default async function user(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const bounties = await prisma.bounties.findMany({
      where: {
        isActive: true,
        isArchived: false,
        deadline: {
          gte: dayjs().toISOString(),
        },
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
        id: true,
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
    res.status(200).json({ bounties, grants, jobs: [] });
  } catch (error) {
    res.status(400).json({
      error,
      message: 'Error occurred while fetching listings',
    });
  }
}
