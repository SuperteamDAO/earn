import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import { sendEmailNotification } from '@/features/emails';
import { prisma } from '@/prisma';

async function comment(req: NextApiRequestWithUser, res: NextApiResponse) {
  const userId = req.userId;
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
    taggedUsers.forEach(async (taggedUser) => {
      await sendEmailNotification({
        type: 'commentTag',
        id: listingId,
        userId: taggedUser.id,
        otherInfo: {
          personName: result.author.username,
        },
      });
    });

    if (replyToUserId !== userId) {
      await sendEmailNotification({
        type: 'commentReply',
        id: listingId,
        userId: replyToUserId as string,
      });
    }

    if (
      userId !== pocId &&
      !taggedUsers.find((t) => t.id.includes(pocId)) &&
      !replyToId
    ) {
      if (listingType === 'BOUNTY') {
        console.log({ pocId: pocId });
        await sendEmailNotification({
          type: 'commentSponsor',
          id: listingId,
          userId: pocId as string,
        });
      }

      if (listingType === 'SUBMISSION') {
        await sendEmailNotification({
          type: 'commentSubmission',
          id: listingId,
          otherInfo: {
            personName: result?.author?.firstName,
          },
        });
      }
    }

    return res.status(200).json(result);
  } catch (error: any) {
    console.error(`User ${userId} unable to edit comment`, error.message);

    return res.status(400).json({
      error,
      message: 'Error occurred while adding a new comment.',
    });
  }
}

export default withAuth(comment);
