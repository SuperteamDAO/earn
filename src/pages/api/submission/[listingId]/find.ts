import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function submission(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const params = req.query;
  const listingId = params.listingId as string;
  try {
    const result = await prisma.submission.findFirst({
      where: {
        listingId,
        isActive: true,
        isArchived: false,
      },
    });
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      error,
      message: `Error occurred while fetching submission of listing=${listingId}.`,
    });
  }
}
