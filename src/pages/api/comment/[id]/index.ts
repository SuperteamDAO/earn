import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function comment(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const params = req.query;
  const listingId = params.id as string;
  const skip = params.skip ? parseInt(params.skip as string, 10) : 0;
  try {
    const result = await prisma.comment.findMany({
      where: {
        listingId,
        isActive: true,
        isArchived: false,
        replyToId: null,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      skip: skip ?? 0,
      take: 10,
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true,
            photo: true,
            username: true,
            currentSponsorId: true,
          },
        },
        replies: {
          include: {
            author: {
              select: {
                firstName: true,
                lastName: true,
                photo: true,
                username: true,
                currentSponsorId: true,
              },
            },
          },
        },
      },
    });

    const commentsCount = await prisma.comment.count({
      where: {
        listingId,
        isActive: true,
        isArchived: false,
        replyToId: null,
      },
    });

    res.status(200).json({
      count: commentsCount,
      result,
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({
      error,
      message: `Error occurred while fetching bounty with listingId=${listingId}.`,
    });
  }
}
