import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import { prisma } from '@/prisma';

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  const params = req.query;
  const listingId = params.listingId as string;
  const userId = req.userId;

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

export default withAuth(handler);
