import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

export default async function comment(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const params = req.query;
  const commentId = params.id as string;

  logger.info(`Request Params: ${safeStringify(req.query)}`);

  if (req.method !== 'DELETE') {
    logger.warn(`Method not allowed: ${req.method}`);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = await getToken({ req });
    if (!token) {
      logger.warn('Unauthorized request - No token provided');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = token.id as string;
    if (!userId) {
      logger.warn('Invalid token - No user ID found');
      return res.status(400).json({ error: 'Invalid token' });
    }

    logger.debug(`Fetching comment with ID: ${commentId}`);
    const comment = await prisma.comment.findUniqueOrThrow({
      where: { id: commentId },
    });

    if (comment.authorId !== userId) {
      logger.warn(`Unauthorized deletion attempt by user ID: ${userId}`);
      return res.status(401).json({ error: 'Unauthorized' });
    }

    logger.debug(`Deleting replies to comment with ID: ${commentId}`);
    await prisma.comment.deleteMany({
      where: { replyToId: commentId },
    });

    logger.debug(`Deleting comment with ID: ${commentId}`);
    await prisma.comment.delete({
      where: { id: commentId },
    });

    logger.info(`Comment deleted successfully by user ID: ${userId}`);
    return res.status(200).json({ message: 'Comment deleted successfully.' });
  } catch (error: any) {
    logger.error(
      `Error occurred while deleting a comment: ${safeStringify(error)}`,
    );
    return res.status(400).json({
      error: 'Error occurred while deleting a comment.',
      message: error.message,
    });
  }
}
