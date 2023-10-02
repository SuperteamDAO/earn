import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function submission(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const params = req.query;
  const listingId = params.listingId as string;
  try {
    const result = await prisma.submission.aggregate({
      _count: true,
      where: {
        listingId,
        isActive: true,
        isArchived: false,
      },
    });
    // eslint-disable-next-line no-underscore-dangle
    res.status(200).json(result?._count || 0);
  } catch (error) {
    res.status(400).json({
      error,
      message: `Error occurred while fetching submission count of listing=${listingId}.`,
    });
  }
}
