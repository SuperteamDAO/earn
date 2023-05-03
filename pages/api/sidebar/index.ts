import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function user(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const totals = await prisma.total.findFirst();
    const earners = await prisma.user.findMany({
      where: {
        totalEarnedInUSD: {
          gt: 0,
        },
      },
      orderBy: {
        totalEarnedInUSD: 'desc',
      },
      take: 10,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        totalEarnedInUSD: true,
        photo: true,
        currentEmployer: true,
      },
    });
    res.status(200).json({ totals, earners });
  } catch (error) {
    res.status(400).json({
      error,
      message: 'Error occurred while fetching totals',
    });
  }
}
