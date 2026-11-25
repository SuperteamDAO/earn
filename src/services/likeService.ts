import { prisma } from '@/prisma';
import { Prisma } from '@prisma/client';

type LikeableModel = 'submission' | 'poW' | 'grantApplication';

type TxClient = Prisma.TransactionClient;

/**
 * Row-level lock for the item being liked, so two concurrent toggles cannot
 * read the same `like` array and clobber each other's write (TOCTOU).
 * Must be called inside an interactive transaction.
 */
async function lockLikeRow(
  tx: TxClient,
  model: LikeableModel,
  itemId: string,
) {
  const table =
    model === 'submission'
      ? 'Submission'
      : model === 'poW'
        ? 'PoW'
        : 'GrantApplication';

  // Table name comes from a fixed map above, never from user input, so
  // Prisma.raw is safe here; itemId stays a bound parameter.
  await tx.$queryRaw(
    Prisma.sql`SELECT id FROM ${Prisma.raw(table)} WHERE id = ${itemId} FOR UPDATE`,
  );
}

function findItem(client: TxClient, model: LikeableModel, itemId: string) {
  if (model === 'submission') {
    return client.submission.findFirstOrThrow({ where: { id: itemId } });
  }
  if (model === 'poW') {
    return client.poW.findFirstOrThrow({ where: { id: itemId } });
  }
  return client.grantApplication.findFirstOrThrow({ where: { id: itemId } });
}

function applyLike(
  client: TxClient,
  model: LikeableModel,
  itemId: string,
  like: { id: string; date: number }[],
  likeCount: number,
) {
  if (model === 'submission') {
    return client.submission.update({
      where: { id: itemId },
      data: { like, likeCount },
    });
  }
  if (model === 'poW') {
    return client.poW.update({
      where: { id: itemId },
      data: { like, likeCount },
    });
  }
  return client.grantApplication.update({
    where: { id: itemId },
    data: { like, likeCount },
  });
}

/**
 * Toggle a user's like on a submission, PoW or grant application.
 *
 * The read of the `like` JSON column and the write back are performed inside a
 * single interactive transaction that first takes a `FOR UPDATE` row lock on
 * the item. Concurrent requests therefore serialise on that lock instead of
 * reading the same array and overwriting each other, and `likeCount` is always
 * derived from the same array that was written.
 */
export async function updateLike(
  model: 'submission' | 'poW' | 'grantApplication',
  itemId: string,
  userId: string,
) {
  return prisma.$transaction(async (tx) => {
    await lockLikeRow(tx, model, itemId);

    const result = await findItem(tx, model, itemId);

    const resLikes = result.like as {
      id: string;
      date: number;
    }[] | null;

    const wasLiked = !!resLikes?.some((e) => e?.id === userId);

    let newLikes: { id: string; date: number }[];

    if (!wasLiked) {
      newLikes = [...(resLikes ?? []), { id: userId, date: Date.now() }];
    } else {
      newLikes = resLikes.filter((e) => e.id !== userId);
    }

    const likeCount = newLikes.length;
    const updatedData = await applyLike(
      tx,
      model,
      itemId,
      newLikes,
      likeCount,
    );

    return {
      // Derived from the toggle action itself, not from the stored likeCount:
      // that column may already be drifted on existing rows.
      likesIncremented: !wasLiked,
      updatedData,
    };
  });
}
