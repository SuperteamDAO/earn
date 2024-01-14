import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function getAllUsers(
  req: NextApiRequest,
  res: NextApiResponse,
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
      },
    });

    if (!user) {
      return res.status(500).json({ error: 'Unable to fetch users' });
    }

    return res.status(200).json(user);
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: `Unable to fetch users: ${error.message}` });
  }
}
