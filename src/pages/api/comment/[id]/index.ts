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

    logger.info(
      `Fetched ${result.length} comments and count=${commentsCount} for listingId=${refId}`,
    );

    res.status(200).json({
      count: commentsCount,
      result,
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
