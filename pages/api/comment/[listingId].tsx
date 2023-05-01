import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function comment(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const params = req.query;
  console.log('file: [listingId].tsx:10 ~ params:', params);
  const listingId = params.listingId as string;
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
      skip: 0,
      take: 10,
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
    res.status(403).json({
      error,
      message: `Error occurred while fetching bounty with listingId=${listingId}.`,
    });
  }
}
