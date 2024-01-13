import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function getAllUsers(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { ...req.body },
      include: {
        Submission: {
          where: {
            listing: {
              isWinnersAnnounced: true,
            },
          },
          include: {
            listing: {
              include: {
                sponsor: true,
              },
            },
          },
        },
        PoW: true,
        Earnings: {
          select: {
            usdValue: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(500).json({ error: 'Unable to fetch users' });
    }

    const totalEarnings = user.Earnings.reduce(
      (acc, earning) => acc + earning.usdValue,
      0
    );
    const response = {
      ...user,
      totalEarnings,
    };

    return res.status(200).json(response);
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: `Unable to fetch users: ${error.message}` });
  }
}
