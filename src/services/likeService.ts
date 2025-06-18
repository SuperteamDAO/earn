import { type InputJsonValue } from '@prisma/client/runtime/library';

import { prisma } from '@/prisma';

interface LikeEntry {
  id: string;
  date: number;
}

interface LikeableItem {
  id: string;
  like: unknown;
  likeCount: number;
}

export async function updateLike(
  model: 'submission' | 'poW' | 'grantApplication' | 'comment',
  itemId: string,
  userId: string,
) {
  let result: LikeableItem | null = null;

  if (model === 'submission') {
    result = await prisma.submission.findFirst({
      where: {
        id: itemId,
      },
      select: {
        id: true,
        like: true,
        likeCount: true,
      },
    });
  } else if (model === 'poW') {
    result = await prisma.poW.findFirst({
      where: {
        id: itemId,
      },
      select: {
        id: true,
        like: true,
        likeCount: true,
      },
    });
  } else if (model === 'grantApplication') {
    result = await prisma.grantApplication.findFirst({
      where: {
        id: itemId,
      },
      select: {
        id: true,
        like: true,
        likeCount: true,
      },
    });
  } else if (model === 'comment') {
    result = await prisma.comment.findFirst({
      where: {
        id: itemId,
      },
      select: {
        id: true,
        like: true,
        likeCount: true,
      },
    });
  } else {
    throw new Error('Invalid model provided');
  }

  if (!result) {
    throw new Error(`${model} not found`);
  }

  let newLikes: LikeEntry[] = [];
  const resLikes = result.like as LikeEntry[] | null;

  if (resLikes && resLikes.length > 0) {
    const existingLike = resLikes.find((e) => e.id === userId);
    if (existingLike) {
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

  let updateLike: unknown;

  if (model === 'submission') {
    updateLike = await prisma.submission.update({
      where: {
        id: itemId,
      },
      data: {
        like: newLikes as unknown as InputJsonValue,
        likeCount,
      },
    });
  } else if (model === 'poW') {
    updateLike = await prisma.poW.update({
      where: {
        id: itemId,
      },
      data: {
        like: newLikes as unknown as InputJsonValue,
        likeCount,
      },
    });
  } else if (model === 'grantApplication') {
    updateLike = await prisma.grantApplication.update({
      where: {
        id: itemId,
      },
      data: {
        like: newLikes as unknown as InputJsonValue,
        likeCount,
      },
    });
  } else if (model === 'comment') {
    updateLike = await prisma.comment.update({
      where: {
        id: itemId,
      },
      data: {
        like: newLikes as unknown as InputJsonValue,
        likeCount,
      },
    });
  }

  return {
    likesIncremented: likeCount > (result?.likeCount || 0),
    updatedData: updateLike,
  };
}
