import { prisma } from '@/prisma';

export async function updateLike(
  model: 'submission' | 'poW' | 'grantApplication',
  itemId: string,
  userId: string,
) {
  return await prisma.$transaction(async (tx) => {
    let result: { id: string; like: unknown; likeCount: number } | null = null;

    if (model === 'submission') {
      const rows = await tx.$queryRaw<
        Array<{ id: string; like: unknown; likeCount: number }>
      >`SELECT id, \`like\`, \`likeCount\` FROM \`Submission\` WHERE id = ${itemId} FOR UPDATE`;
      result = rows[0] || null;
    } else if (model === 'poW') {
      const rows = await tx.$queryRaw<
        Array<{ id: string; like: unknown; likeCount: number }>
      >`SELECT id, \`like\`, \`likeCount\` FROM \`PoW\` WHERE id = ${itemId} FOR UPDATE`;
      result = rows[0] || null;
    } else if (model === 'grantApplication') {
      const rows = await tx.$queryRaw<
        Array<{ id: string; like: unknown; likeCount: number }>
      >`SELECT id, \`like\`, \`likeCount\` FROM \`GrantApplication\` WHERE id = ${itemId} FOR UPDATE`;
      result = rows[0] || null;
    } else {
      throw new Error('Invalid model provided');
    }

    if (!result) {
      throw new Error(`Record not found in ${model} with id ${itemId}`);
    }

    let resLikes: { id: string; date: number }[] = [];
    if (Array.isArray(result.like)) {
      resLikes = result.like as { id: string; date: number }[];
    } else if (typeof result.like === 'string') {
      try {
        resLikes = JSON.parse(result.like);
      } catch {
        resLikes = [];
      }
    }

    let newLikes: { id: string; date: number }[] = [];
    const hasLiked = resLikes.some((e) => e?.id === userId);

    if (hasLiked) {
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

    const likeCount = newLikes.length;
    let updateLike;

    if (model === 'submission') {
      updateLike = await tx.submission.update({
        where: {
          id: itemId,
        },
        data: {
          like: newLikes as any,
          likeCount,
        },
      });
    } else if (model === 'poW') {
      updateLike = await tx.poW.update({
        where: {
          id: itemId,
        },
        data: {
          like: newLikes as any,
          likeCount,
        },
      });
    } else if (model === 'grantApplication') {
      updateLike = await tx.grantApplication.update({
        where: {
          id: itemId,
        },
        data: {
          like: newLikes as any,
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