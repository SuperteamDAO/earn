import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function comment(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { authorId, message, listingId, listingType } = req.body;
  try {
    const result = await prisma.comment.create({
      data: {
        authorId,
        message,
        listingId,
        listingType,
      },
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
    console.log('file: create.ts:31 ~ comment ~ error:', error);
    res.status(400).json({
      error,
      message: 'Error occurred while adding a new comment.',
    });
  }
}
