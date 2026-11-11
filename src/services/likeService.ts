import { prisma } from '@/prisma';

interface LikeEntry {
  id: string;
  date: number;
}

const MAX_OCC_RETRIES = 5;
const BASE_RETRY_DELAY_MS = 25;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function updateLike(
  model: 'submission' | 'poW' | 'grantApplication',
  itemId: string,
  userId: string,
) {
  if (model !== 'submission' && model !== 'poW' && model !== 'grantApplication') {
    throw new Error('Invalid model provided');
  }

  for (let attempt = 0; attempt < MAX_OCC_RETRIES; attempt++) {
    try {
      const transactionResult = await prisma.$transaction(async (tx) => {
        // Fetch current record within transaction
        let result: {
          id: string;
          like: any;
          likeCount: number;
          updatedAt: Date;
        } | null = null;

        if (model === 'submission') {
          result = await tx.submission.findUnique({
            where: { id: itemId },
            select: { id: true, like: true, likeCount: true, updatedAt: true },
          });
        } else if (model === 'poW') {
          result = await tx.poW.findUnique({
            where: { id: itemId },
            select: { id: true, like: true, likeCount: true, updatedAt: true },
          });
        } else if (model === 'grantApplication') {
          result = await tx.grantApplication.findUnique({
            where: { id: itemId },
            select: { id: true, like: true, likeCount: true, updatedAt: true },
          });
        }

        if (!result) {
          throw new Error(`${model} with id ${itemId} not found`);
        }

        const resLikes = (result.like as LikeEntry[]) || [];
        let newLikes: LikeEntry[];

        if (Array.isArray(resLikes) && resLikes.length > 0) {
          const alreadyLiked = resLikes.some((e) => e?.id === userId);
          if (alreadyLiked) {
            newLikes = resLikes.filter((e) => e?.id !== userId);
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
        const initialLikeCount = result.likeCount ?? 0;

        // Perform atomic conditional update with OCC on updatedAt to eliminate TOCTOU race conditions
        let updateCount = 0;
        if (model === 'submission') {
          const res = await tx.submission.updateMany({
            where: {
              id: itemId,
              updatedAt: result.updatedAt,
            },
            data: {
              like: newLikes,
              likeCount,
            },
          });
          updateCount = res.count;
        } else if (model === 'poW') {
          const res = await tx.poW.updateMany({
            where: {
              id: itemId,
              updatedAt: result.updatedAt,
            },
            data: {
              like: newLikes,
              likeCount,
            },
          });
          updateCount = res.count;
        } else if (model === 'grantApplication') {
          const res = await tx.grantApplication.updateMany({
            where: {
              id: itemId,
              updatedAt: result.updatedAt,
            },
            data: {
              like: newLikes,
              likeCount,
            },
          });
          updateCount = res.count;
        }

        // If updateCount is 0, another concurrent write modified this record between read and update.
        // Throw a concurrency error to trigger clean retry on the transaction.
        if (updateCount === 0) {
          const conflictErr = new Error('CONCURRENCY_CONFLICT');
          (conflictErr as any).code = 'CONCURRENCY_CONFLICT';
          throw conflictErr;
        }

        // Fetch the fresh updated record to return to caller
        let updatedRecord = null;
        if (model === 'submission') {
          updatedRecord = await tx.submission.findUnique({ where: { id: itemId } });
        } else if (model === 'poW') {
          updatedRecord = await tx.poW.findUnique({ where: { id: itemId } });
        } else if (model === 'grantApplication') {
          updatedRecord = await tx.grantApplication.findUnique({ where: { id: itemId } });
        }

        return {
          likesIncremented: likeCount > initialLikeCount,
          updatedData: updatedRecord,
        };
      });

      return transactionResult;
    } catch (err: any) {
      if (err?.message === 'CONCURRENCY_CONFLICT' || err?.code === 'CONCURRENCY_CONFLICT') {
        if (attempt < MAX_OCC_RETRIES - 1) {
          const delay = BASE_RETRY_DELAY_MS * Math.pow(2, attempt) + Math.floor(Math.random() * 20);
          await sleep(delay);
          continue;
        }
        throw new Error(`Failed to update like after ${MAX_OCC_RETRIES} attempts due to high concurrency.`);
      }
      throw err;
    }
  }

  throw new Error(`Failed to update like after ${MAX_OCC_RETRIES} attempts.`);
}
