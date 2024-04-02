import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

import { prisma } from '@/prisma';

export default async function submission(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const params = req.query;
  const listingId = params.listingId as string;
  const token = await getToken({ req });

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = token.id;

  if (!userId) {
    return res.status(400).json({ error: 'Invalid token' });
  }

  try {
    const result = await prisma.submission.findFirst({
      where: {
        listingId,
        userId,
        isActive: true,
        isArchived: false,
      },
    });
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      error,
      message: `Error occurred while fetching submission of listing=${listingId} for user=${userId}.`,
    });
  }
}
