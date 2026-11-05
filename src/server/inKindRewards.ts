import { prisma } from '@/prisma';

import { inKindRewardSelect } from '@/features/listings/constants/inKindReward';

export async function getInKindRewardList() {
  return prisma.inKindReward.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      name: 'asc',
    },
    select: inKindRewardSelect,
  });
}

export async function getActiveInKindRewardById(id: string) {
  return prisma.inKindReward.findFirst({
    where: {
      id,
      isActive: true,
    },
    select: inKindRewardSelect,
  });
}
