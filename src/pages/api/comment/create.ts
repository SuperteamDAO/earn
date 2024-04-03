import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import { sendEmailNotification } from '@/features/emails';
import { prisma } from '@/prisma';

async function comment(req: NextApiRequestWithUser, res: NextApiResponse) {
  try {
    const userId = req.userId;

    const { message, listingId, listingType } = req.body;

    const result = await prisma.comment.create({
      data: {
        authorId: userId as string,
        message,
        listingId,
      },
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true,
            photo: true,
            username: true,
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
    return res.status(400).json({
      error,
      message: 'Error occurred while adding a new comment.',
    });
  }
}

export default withAuth(comment);
