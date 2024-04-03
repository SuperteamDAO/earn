import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import { sendEmailNotification } from '@/features/emails';
import { prisma } from '@/prisma';

async function submission(req: NextApiRequestWithUser, res: NextApiResponse) {
  try {
    const userId = req.userId;
    const { submissionId } = req.body;

    const result = await prisma.submission.findFirst({
      where: {
        id: submissionId,
      },
    });

    let newLikes = [];

    const resLikes = result?.like as {
      id: string;
      date: number;
    }[];

    if (resLikes?.length > 0) {
      const like = resLikes.find((e) => e?.id === userId);

      if (like) {
        newLikes = resLikes.filter((e) => e.id !== userId);
      } else {
        newLikes = [
          ...resLikes,
          {
            id: userId,
            date: Date.now(),
          },
        ];
        await sendEmailNotification({
          type: 'submissionLike',
          id: submissionId,
          userId: userId as string,
        });
      }
    } else {
      newLikes = [
        {
          id: userId,
          date: Date.now(),
        },
      ];
      await sendEmailNotification({
        type: 'submissionLike',
        id: submissionId,
        userId: userId as string,
      });
    }

    const updateLike = await prisma.submission.update({
      where: {
        id: submissionId,
      },
      data: {
        like: newLikes,
      },
    });

    return res.status(200).json(updateLike);
  } catch (error) {
    return res.status(400).json({
      error,
      message: `Error occurred while fetching submission.`,
    });
  }
}

export default withAuth(submission);
