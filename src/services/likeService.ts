import { prisma } from '@/prisma';
import { LikeTargetType } from '@/prisma/enums';

const targetTypeMap: Record<string, keyof typeof LikeTargetType> = {
  submission: 'SUBMISSION',
  poW: 'POW',
  grantApplication: 'GRANT_APPLICATION',
};

type TxPrisma = Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'>;

const modelUpdateMap: Record<
  string,
  (id: string, delta: number, tx?: TxPrisma) => Promise<unknown>
> = {
  submission: (id: string, delta: number, tx?: TxPrisma) =>
    (tx ?? prisma).submission.update({
      where: { id },
      data: { likeCount: { increment: delta } },
    }),
  poW: (id: string, delta: number, tx?: TxPrisma) =>
    (tx ?? prisma).poW.update({
      where: { id },
      data: { likeCount: { increment: delta } },
    }),
  grantApplication: (id: string, delta: number, tx?: TxPrisma) =>
    (tx ?? prisma).grantApplication.update({
      where: { id },
      data: { likeCount: { increment: delta } },
    }),
};

export async function updateLike(
  model: 'submission' | 'poW' | 'grantApplication',
  itemId: string,
  userId: string,
): Promise<{ likesIncremented: boolean }> {
  const targetType = LikeTargetType[targetTypeMap[model]!];
  const uniqueWhere = {
    userId_targetType_targetId: { userId, targetType, targetId: itemId },
  } as const;

  try {
    return await prisma.$transaction(async (tx) => {
      await tx.likes.create({
        data: { userId, targetType, targetId: itemId },
      });
      await modelUpdateMap[model]!(itemId, 1, tx);
      return { likesIncremented: true };
    });
  } catch (err: any) {
    if (err.code === 'P2002') {
      return await prisma.$transaction(async (tx) => {
        try {
          await tx.likes.delete({ where: uniqueWhere });
        } catch (deleteErr: any) {
          if (deleteErr.code !== 'P2025') throw deleteErr;
          return { likesIncremented: false };
        }
        await modelUpdateMap[model]!(itemId, -1, tx);
        return { likesIncremented: false };
      });
    }
    throw err;
  }
}
