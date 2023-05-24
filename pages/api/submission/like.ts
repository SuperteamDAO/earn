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
    console.log(result?.like, resLikes, 'up');

    if (resLikes?.length > 0) {
      console.log(resLikes, '--resLikes');
      const like = resLikes.find((e) => e?.id === userId);
      console.log(like, '--like');

      if (like) {
        const temp: any[] = [];
        resLikes.forEach((e) => {
          console.log(e, '--e');

          if (e.id !== userId) {
            temp.push(e);
          }
        });
        newLikes = temp;
      } else {
        console.log('--t');
        newLikes = [
          ...resLikes,
          {
            id: userId,
            date: Date.now(),
          },
        ];
      }
    } else {
      console.log('new');
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
