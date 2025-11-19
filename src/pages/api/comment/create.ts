import type { NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { commentCreateRateLimiter } from '@/lib/ratelimit';
import { checkAndApplyRateLimit } from '@/lib/rateLimiterService';
import { prisma } from '@/prisma';
import { type CommentRefType } from '@/prisma/enums';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithUser } from '@/features/auth/types';
import { withAuth } from '@/features/auth/utils/withAuth';
import { queueEmail } from '@/features/emails/utils/queueEmail';

type CommentType =
  | 'NORMAL'
  | 'SUBMISSION'
  | 'DEADLINE_EXTENSION'
  | 'WINNER_ANNOUNCEMENT';

async function commentHandler(
  req: NextApiRequestWithUser,
  res: NextApiResponse,
) {
  const userId = req.userId;

  if (!userId) {
    logger.warn(
      '[CommentCreateAPI] userId not found after withAuth. This should not happen.',
    );
    return res
      .status(401)
      .json({ message: 'Authentication required and user ID missing.' });
  }

  const canProceed = await checkAndApplyRateLimit(res, {
    limiter: commentCreateRateLimiter,
    identifier: userId,
    routeName: 'commentCreate',
  });

  if (!canProceed) {
    return;
  }

  logger.debug(
    `[CommentCreateAPI] Request body for user ${userId}: ${safeStringify(req.body)}`,
  );

  try {
    const {
      pocId,
      message,
      refId,
      replyToId,
      submissionId,
      replyToUserId,
      isPinned,
    } = req.body;
    const refType = req.body.refType as CommentRefType;
    let { type } = req.body as { type: CommentType | undefined };
    if (!type) type = 'NORMAL';

    if (isPinned) {
      if (refType === 'BOUNTY') {
        const listing = await prisma.bounties.findUnique({
          where: { id: refId },
          select: { pocId: true },
        });
        if (!listing || listing.pocId !== userId) {
          logger.warn(`Unauthorized pin attempt by user ID: ${userId}`);
          return res
            .status(403)
            .json({ error: 'Only the listing POC can pin comments' });
        }
      } else {
        return res
          .status(403)
          .json({ error: 'Pinning is only allowed for bounty comments' });
      }
    }

    logger.debug(`[CommentCreateAPI] Creating comment for user: ${userId}`);
    const result = await prisma.comment.create({
      data: {
        authorId: userId as string,
        message: message as string,
        replyToId: replyToId as string | undefined,
        refId: refId as string,
        refType: refType as CommentRefType,
        type,
        submissionId: submissionId as string | undefined,
        isPinned: isPinned || false,
      },
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true,
            photo: true,
            username: true,
            currentSponsorId: true,
            isPro: true,
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
                isPro: true,
              },
            },
          },
        },
      },
    });

    logger.debug('Checking for tagged users in the comment');
    const taggedUsernames = (message as string)
      .split(' ')
      .filter((tag) => tag.startsWith('@'))
      .map((tag) => tag.substring(1));
    const taggedUsers = await prisma.user.findMany({
      select: {
        id: true,
      },
      where: {
        AND: [
          {
            username: {
              in: taggedUsernames,
            },
          },
          {
            NOT: {
              id: userId as string,
            },
          },
        ],
      },
    });

    try {
      if (taggedUsers.length > 0) {
        logger.debug('Sending email notifications to tagged users');
        for (const taggedUser of taggedUsers) {
          await queueEmail({
            type: 'commentTag',
            id: refId,
            userId: taggedUser.id,
            otherInfo: {
              personName: result.author.firstName,
              type: refType,
            },
            triggeredBy: userId,
          });
        }
      }

      if (replyToUserId && replyToUserId !== userId) {
        logger.debug(
          `Sending email notification to user ID: ${replyToUserId} for comment reply`,
        );
        await queueEmail({
          type: 'commentReply',
          id: refId,
          userId: replyToUserId as string,
          triggeredBy: userId,
          otherInfo: {
            type: refType,
          },
        });
      }

      if (
        userId !== pocId &&
        !taggedUsers.find((t) => t.id.includes(pocId)) &&
        !replyToId
      ) {
        if (refType === 'BOUNTY' && type === 'NORMAL') {
          logger.info(`Sending email notification to POC ID: ${pocId}`);
          await queueEmail({
            type: 'commentSponsor',
            id: refId,
            userId: pocId as string,
            triggeredBy: userId,
          });
        }

        if (refType !== 'BOUNTY' && type === 'NORMAL') {
          logger.info(`Sending email notification for activity comment`);
          await queueEmail({
            type: 'commentActivity',
            id: refId,
            otherInfo: {
              personName: result?.author?.firstName,
              type: refType,
            },
            triggeredBy: userId,
          });
        }
      }
    } catch (err) {
      logger.error(`Error Sending Email Notifications - ${err}`);
    }

    logger.info(
      `[CommentCreateAPI] Comment added by user ${userId}: ${result.id}`,
    );
    return res.status(200).json(result);
  } catch (error: any) {
    logger.error(
      `[CommentCreateAPI] Error adding comment for user ${userId}: ${safeStringify(error)}`,
    );
    return res.status(400).json({
      message: 'Error occurred while adding a new comment.',
    });
  }
}

export default withAuth(commentHandler);
