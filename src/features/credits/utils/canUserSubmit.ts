import { prisma } from '@/prisma';

import { creditAggregate } from '@/features/credits/utils/creditAggregate';

type PrismaLike = Parameters<typeof creditAggregate>[1];

export async function canUserSubmit(
  userId: string,
  client: PrismaLike = prisma,
) {
  const balance = await creditAggregate(userId, client);
  return balance > 0;
}
