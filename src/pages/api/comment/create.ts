import { type CommentRefType } from '@prisma/client';
import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import { sendEmailNotification } from '@/features/emails';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

type CommentType =
  | 'NORMAL'
  | 'SUBMISSION'
  | 'DEADLINE_EXTENSION'
  | 'WINNER_ANNOUNCEMENT';

async function comment(req: NextApiRequestWithUser, res: NextApiResponse) {
  const userId = req.userId;
  logger.debug(`Request body: ${safeStringify(req.body)}`);

  try {
    const { pocId, message, refId, replyToId, submissionId, replyToUserId } =
      req.body;
    const refType = req.body.refType as CommentRefType;
    let { type } = req.body as { type: CommentType | undefined };
    if (!type) type = 'NORMAL';

    logger.debug('Creating a new comment in the database');
    const result = await prisma.comment.create({
      data: {
        authorId: userId as string,
        message: message as string,
        replyToId: replyToId as string | undefined,
        refId: refId as string,
        refType: refType as CommentRefType,
        type,
        submissionId: submissionId as string | undefined,
      },
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
          sendEmailNotification({
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
        sendEmailNotification({
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
          sendEmailNotification({
            type: 'commentSponsor',
            id: refId,
            userId: pocId as string,
            triggeredBy: userId,
          });
        }

        if (refType !== 'BOUNTY' && type === 'NORMAL') {
          logger.info(`Sending email notification for activity comment`);
          sendEmailNotification({
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

    logger.info(`Comment added successfully by user ID: ${userId}`);
    return res.status(200).json(result);
  } catch (error: any) {
    logger.error(
      `User ${userId} unable to add comment: ${safeStringify(error)}`,
    );
    return res.status(400).json({
      error,
      message: 'Error occurred while adding a new comment.',
    });
  }
}

export default withAuth(comment);
