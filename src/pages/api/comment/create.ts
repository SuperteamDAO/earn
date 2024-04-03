import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

import { sendEmailNotification } from '@/features/emails';
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

    const { message, listingId, listingType, replyToId, submissionId } =
      req.body;
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

    if (listingType === 'BOUNTY') {
      await sendEmailNotification({
        type: 'commentSponsor',
        id: listingId,
        userId: userId as string,
      });
    }

    if (listingType === 'SUBMISSION') {
      await sendEmailNotification({
        type: 'commentSubmission',
        id: listingId,
        userId: userId as string,
      });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.log('error', error);
    return res.status(400).json({
      error,
      message: 'Error occurred while adding a new comment.',
    });
  }
}
