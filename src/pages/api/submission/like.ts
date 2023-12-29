import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function submission(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { submissionId, userId } = req.body;
  try {
    const result = await prisma.submission.findFirst({
      where: {
        id: submissionId,
      },
    });
    let newLikes: {
      id: string;
      date: number;
    }[] = [];

    const resLikes = result?.like as unknown as {
      id: string;
      date: number;
    }[];

    if (resLikes?.length > 0) {
      const like = resLikes.find((e) => e?.id === userId);

      if (like) {
        const temp: any[] = [];
        resLikes.forEach((e) => {
          if (e.id !== userId) {
            temp.push(e);
          }
        });
        newLikes = temp;
      } else {
        newLikes = [
          ...resLikes,
          {
            id: userId,
            date: Date.now(),
          },
        ];
      }
    } else {
      newLikes = [
        {
          id: userId,
          date: Date.now(),
        },
      ];
    }

    const updateLike = await prisma.submission.update({
      where: {
        id: submissionId,
      },
      data: {
        like: newLikes,
      },
    });
    res.status(200).json(updateLike);
  } catch (error) {
    res.status(400).json({
      error,
      message: `Error occurred while fetching submission.`,
    });
  }
}
