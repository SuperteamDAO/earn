import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function comment(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const params = req.query;
  const listingId = params.listingId as string;
  const skip = params.skip ? parseInt(params.skip as string, 10) : 0;
  try {
    const result = await prisma.comment.findMany({
      where: {
        listingId,
        isActive: true,
        isArchived: false,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      skip: skip ?? 0,
      take: 30,
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true,
            photo: true,
            username: true,
          },
        },
      },
    });
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      error,
      message: `Error occurred while fetching bounty with listingId=${listingId}.`,
    });
  }
}
