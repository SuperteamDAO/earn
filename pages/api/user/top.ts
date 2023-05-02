import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function user(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const result = await prisma.user.findMany({
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
        firstName: true,
        lastName: true,
        username: true,
        totalEarnedInUSD: true,
        photo: true,
      },
    });
    res.status(200).json(result);
  } catch (err) {
    console.log(err);
    res.status(400).json({ err: 'Error occurred while adding a new food.' });
  }
}
