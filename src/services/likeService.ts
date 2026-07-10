import { prisma } from '@/prisma';
import { LikeTargetType } from '@/prisma/enums';

const targetTypeMap: Record<string, keyof typeof LikeTargetType> = {
  submission: 'SUBMISSION',
  poW: 'POW',
  grantApplication: 'GRANT_APPLICATION',
};

const modelUpdateMap: Record<
  string,
  (id: string, delta: number) => Promise<unknown>
> = {
  submission: (id: string, delta: number) =>
    prisma.submission.update({
      where: { id },
      data: { likeCount: { increment: delta } },
    }),
  poW: (id: string, delta: number) =>
    prisma.poW.update({
      where: { id },
      data: { likeCount: { increment: delta } },
    }),
  grantApplication: (id: string, delta: number) =>
    prisma.grantApplication.update({
      where: { id },
      data: { likeCount: { increment: delta } },
    }),
};

export async function updateLike(
  model: 'submission' | 'poW' | 'grantApplication',
  itemId: string,
  userId: string,
) {
  const targetType = LikeTargetType[targetTypeMap[model]!];
  const uniqueWhere = {
    userId_targetType_targetId: { userId, targetType, targetId: itemId },
  } as const;

  try {
    await prisma.likes.create({
      data: { userId, targetType, targetId: itemId },
    });
    await modelUpdateMap[model]!(itemId, 1);
    return { likesIncremented: true };
  } catch (err: any) {
    if (err.code === 'P2002') {
      try {
        await prisma.likes.delete({ where: uniqueWhere });
      } catch (deleteErr: any) {
        if (deleteErr.code !== 'P2025') throw deleteErr;
        return { likesIncremented: false };
      }
      await modelUpdateMap[model]!(itemId, -1);
      return { likesIncremented: false };
    }
    throw err;
  }
}
