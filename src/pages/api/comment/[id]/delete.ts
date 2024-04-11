import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

import { prisma } from '@/prisma';

export default async function comment(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const token = await getToken({ req });
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = token.id as string;
    if (!userId) {
      return res.status(400).json({ error: 'Invalid token' });
    }

    const params = req.query;
    const commentId = params.id as string;
    const comment = await prisma.comment.findUniqueOrThrow({
      where: {
        id: commentId,
      },
    });
    if (comment.authorId !== userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    await prisma.comment.deleteMany({
      where: {
        replyToId: commentId,
      },
    });
    await prisma.comment.deleteMany({
      where: {
        id: commentId,
      },
    });
    return res.status(200).json({
      message: 'Comment deleted successfully.',
    });
  } catch (error) {
    return res.status(400).json({
      error,
      message: 'Error occurred while deleting a comment.',
    });
  }
}
