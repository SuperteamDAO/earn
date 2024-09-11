import { prisma } from '@/prisma';

export async function updateLike(
  model: 'submission' | 'poW' | 'grantApplication',
  itemId: string,
  userId: string,
) {
  let result;

  if (model === 'submission') {
    result = await prisma.submission.findFirst({
      where: {
        id: itemId,
      },
    });
  } else if (model === 'poW') {
    result = await prisma.poW.findFirst({
      where: {
        id: itemId,
      },
    });
  } else if (model === 'grantApplication') {
    result = await prisma.grantApplication.findFirst({
      where: {
        id: itemId,
      },
    });
  } else {
    throw new Error('Invalid model provided');
  }

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
    updateLike = await prisma.submission.update({
      where: {
        id: itemId,
      },
      data: {
        like: newLikes,
        likeCount,
      },
    });
  } else if (model === 'poW') {
    updateLike = await prisma.poW.update({
      where: {
        id: itemId,
      },
      data: {
        like: newLikes,
        likeCount,
      },
    });
  } else if (model === 'grantApplication') {
    updateLike = await prisma.grantApplication.update({
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
    likesIncremented: likeCount > (result?.likeCount || 0),
    updatedData: updateLike,
  };
}
