import type { NextApiRequest, NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

export default async function comment(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  logger.info(`Request Query: ${safeStringify(req.query)}`);

  const params = req.query;
  const refId = params.id as string;
  const skip = params.skip ? parseInt(params.skip as string, 10) : 0;
  const take = params.take ? parseInt(params.take as string, 10) : 0;

  logger.debug(`Fetching comments for listingId=${refId}, skip=${skip}`);

  try {
    const result = await prisma.comment.findMany({
      where: {
        refId,
        isActive: true,
        isArchived: false,
        replyToId: null,
        type: {
          not: 'SUBMISSION',
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      skip: skip ?? 0,
      take,
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
          orderBy: {
            updatedAt: 'asc',
          },
        },
      },
    });

    const commentsCount = await prisma.comment.count({
      where: {
        refId,
        isActive: true,
        isArchived: false,
        replyToId: null,
        type: {
          not: 'SUBMISSION',
        },
      },
    });

    const mentionedUsernames = extractUsernames(result);
    const validUsernames = await prisma.user.findMany({
      where: {
        username: {
          in: Array.from(mentionedUsernames),
        },
      },
      select: {
        username: true,
      },
    });

    logger.info(
      `Fetched ${result.length} comments and count=${commentsCount} for listingId=${refId}`,
    );

    res.status(200).json({
      count: commentsCount,
      result,
      validUsernames: validUsernames
        .map((user) => user.username)
        .filter(Boolean),
    });
  } catch (error: any) {
    logger.error(
      `Error occurred while fetching comments for listingId=${refId}: ${safeStringify(error)}`,
    );
    res.status(400).json({
      error: 'Error occurred while fetching comments.',
      message: `Error occurred while fetching bounty with listingId=${refId}.`,
    });
  }
}

function extractUsernames(comments: any[]): Set<string> {
  const usernames = new Set<string>();
  const usernamePattern = /^[a-z0-9_-]+$/;

  const processMessage = (message: string) => {
    const matches = message.match(/@(\w+)/g);
    if (matches) {
      matches.forEach((match) => {
        const username = match.slice(1);
        if (username && usernamePattern.test(username)) {
          usernames.add(username);
        }
      });
    }
  };

  comments.forEach((comment) => {
    processMessage(comment.message);
    if (comment.replies && comment.replies.length > 0) {
      comment.replies.forEach((reply: any) => {
        processMessage(reply.message);
      });
    }
  });

  return usernames;
}
