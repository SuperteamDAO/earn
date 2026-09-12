import { prisma } from '@/prisma';

export async function updateLike(
  model: 'submission' | 'poW' | 'grantApplication',
  itemId: string,
  userId: string,
) {
  return await prisma.$transaction(async (tx) => {
    let result: any;

    if (model === 'submission') {
      result = await tx.submission.findUnique({
        where: {
          id: itemId,
        },
      });
    } else if (model === 'poW') {
      result = await tx.poW.findUnique({
        where: {
          id: itemId,
        },
      });
    } else if (model === 'grantApplication') {
      result = await tx.grantApplication.findUnique({
        where: {
          id: itemId,
        },
      });
    } else {
      throw new Error('Invalid model provided');
    }

    if (!result) {
      throw new Error(`${model} with id ${itemId} not found`);
    }

    let newLikes = [];
    const resLikes = (result.like as {
      id: string;
      date: number;
    }[]) || [];

    if (resLikes.length > 0) {
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
      }
    } else {
      newLikes = [
        {
          id: userId,
          date: Date.now(),
        },
      ];
    }

    const likeCount = newLikes.length;

    let updateLike;

    if (model === 'submission') {
      updateLike = await tx.submission.update({
        where: {
          id: itemId,
        },
        data: {
          like: newLikes,
          likeCount,
        },
      });
    } else if (model === 'poW') {
      updateLike = await tx.poW.update({
        where: {
          id: itemId,
        },
        data: {
          like: newLikes,
          likeCount,
        },
      });
    } else if (model === 'grantApplication') {
      updateLike = await tx.grantApplication.update({
        where: {
          id: itemId,
        },
        data: {
          like: newLikes,
          likeCount,
        },
      });
    }

    return {
      likesIncremented: likeCount > (result.likeCount || 0),
      updatedData: updateLike,
    };
  });
}
