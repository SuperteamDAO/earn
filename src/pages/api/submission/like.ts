import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

import { sendEmailNotification } from '@/features/emails';
import { prisma } from '@/prisma';

export default async function submission(
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
