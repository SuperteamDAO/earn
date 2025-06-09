import type { NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithUser } from '@/features/auth/types';
import { withAuth } from '@/features/auth/utils/withAuth';

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  const params = req.query;
  const commentId = params.id as string;
  const userId = req.userId;
  const { isPinned } = req.body;
  if (typeof isPinned !== 'boolean') {
    logger.warn(`Invalid isPinned value: ${isPinned}`);
    return res.status(400).json({ error: 'isPinned must be a boolean value' });
  }
  logger.info(`Request Params: ${safeStringify(req.query)}`);

  if (req.method !== 'POST') {
    logger.warn(`Method not allowed: ${req.method}`);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        listing: {
          select: {
            pocId: true,
          },
        },
      },
    });

    if (!comment) {
      logger.warn(`Comment not found: ${commentId}`);
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.listing?.pocId !== userId) {
      logger.warn(`Unauthorized pin attempt by user ID: ${userId}`);
      return res
        .status(403)
        .json({ error: 'Only the listing POC can pin comments' });
    }

    if (comment.replyToId) {
      logger.warn(`Attempt to pin a reply: ${commentId}`);
      return res.status(400).json({ error: 'Cannot pin replies' });
    }

    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: { isPinned },
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
    });

    logger.info(
      `Comment ${commentId} ${isPinned ? 'pinned' : 'unpinned'} by user ID: ${userId}`,
    );
    return res.status(200).json(updatedComment);
  } catch (error: any) {
    logger.error(
      `Error occurred while pinning/unpinning comment: ${safeStringify(error)}`,
    );
    return res.status(400).json({
      error: 'Error occurred while pinning/unpinning comment.',
      message: error.message,
    });
  }
}

export default withAuth(handler);
