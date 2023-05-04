import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function user(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.body;
  try {
    const result = await prisma.userSponsors.findMany({
      where: { userId },
      orderBy: {
        updatedAt: 'asc',
      },
      include: { sponsor: true },
    });
    res.status(200).json(result);
  } catch (error) {
    console.log('file: create.ts:29 ~ user ~ error:', error);
    res.status(400).json({
      error,
      message: 'Error occurred while adding a new sponsor.',
    });
  }
}
