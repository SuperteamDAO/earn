import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import { sendEmailNotification } from '@/features/emails';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

async function comment(req: NextApiRequestWithUser, res: NextApiResponse) {
  const userId = req.userId;
  logger.debug(`Request body: ${safeStringify(req.body)}`);

  try {
    const {
      pocId,
      message,
      listingId,
      listingType,
      replyToId,
      submissionId,
      replyToUserId,
    } = req.body;
    let { type } = req.body;
    if (!type) type = 'NORMAL';

    logger.debug('Creating a new comment in the database');
    const result = await prisma.comment.create({
      data: {
        authorId: userId as string,
        message: message as string,
        replyToId: replyToId as string | undefined,
        listingId: listingId as string,
        type: type as
          | 'NORMAL'
          | 'SUBMISSION'
          | 'DEADLINE_EXTENSION'
          | 'WINNER_ANNOUNCEMENT',
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

    logger.debug('Sending email notifications to tagged users');
    taggedUsers.forEach(async (taggedUser) => {
      await sendEmailNotification({
        type: 'commentTag',
        id: listingId,
        userId: taggedUser.id,
        otherInfo: {
          personName: result.author.username,
        },
        triggeredBy: userId,
      });
    });

    if (replyToUserId !== userId) {
      logger.debug(
        `Sending email notification to user ID: ${replyToUserId} for comment reply`,
      );
      await sendEmailNotification({
        type: 'commentReply',
        id: listingId,
        userId: replyToUserId as string,
        triggeredBy: userId,
      });
    }

    if (
      userId !== pocId &&
      !taggedUsers.find((t) => t.id.includes(pocId)) &&
      !replyToId
    ) {
      if (listingType === 'BOUNTY') {
        logger.info(`Sending email notification to POC ID: ${pocId}`);
        await sendEmailNotification({
          type: 'commentSponsor',
          id: listingId,
          userId: pocId as string,
          triggeredBy: userId,
        });
      }

      if (listingType === 'SUBMISSION') {
        logger.info(`Sending email notification for submission comment`);
        await sendEmailNotification({
          type: 'commentSubmission',
          id: listingId,
          otherInfo: {
            personName: result?.author?.firstName,
          },
          triggeredBy: userId,
        });
      }
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
