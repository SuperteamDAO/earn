import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

import { prisma } from '@/prisma';

export default async function user(req: NextApiRequest, res: NextApiResponse) {
  const token = await getToken({ req });

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = token.id;

  if (!userId) {
    return res.status(400).json({ error: 'Invalid token' });
  }

  try {
    const result = await prisma.userSponsors.findMany({
      where: { userId },
      orderBy: {
        updatedAt: 'asc',
      },
      include: { sponsor: true },
    });
    return res.status(200).json(result);
  } catch (error) {
    console.log('file: create.ts:29 ~ user ~ error:', error);
    return res.status(400).json({
      error,
      message: 'Error occurred while adding a new sponsor.',
    });
  }
}
