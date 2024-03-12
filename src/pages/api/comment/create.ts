import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

import { prisma } from '@/prisma';

export default async function comment(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const token = await getToken({ req });

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = token.id;

    if (!userId) {
      return res.status(400).json({ error: 'Invalid token' });
    }

    const { message, listingId } = req.body;

    const result = await prisma.comment.create({
      data: {
        authorId: userId as string,
        message,
        listingId,
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

    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      error,
      message: 'Error occurred while adding a new comment.',
    });
  }
}
