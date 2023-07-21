import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function getUsersCount(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const usersCount = await prisma.user.count({
        where: {
          isVerified: true,
        },
      });

      res.status(200).json({ totalUsers: usersCount });
    } catch (error: any) {
      console.error('Error:', error);
      res
        .status(500)
        .json({ error: 'Failed to get the total number of verified users.' });
    }
  } else {
    res
      .status(405)
      .json({ error: 'This endpoint only supports GET requests.' });
  }
}
