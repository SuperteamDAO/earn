import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

import { prisma } from '@/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { categories } = req.body;

  const token = await getToken({ req });

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = token.id;

  if (!userId) {
    return res.status(400).json({ error: 'Invalid token' });
  }

  try {
    await prisma.emailSettings.deleteMany({
      where: {
        userId: userId as string,
      },
    });

    await Promise.all(
      categories.map((category: any) =>
        prisma.emailSettings.create({
          data: {
            userId: userId as string,
            category,
          },
        }),
      ),
    );

    res
      .status(200)
      .json({ message: 'Email preferences updated successfully!' });
  } catch (error) {
    console.error('Failed to update email preferences:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
