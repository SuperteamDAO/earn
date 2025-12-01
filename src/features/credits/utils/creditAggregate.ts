import { prisma } from '@/prisma';
import { dayjs } from '@/utils/dayjs';

export async function creditAggregate(userId: string) {
  const effectiveMonth = dayjs.utc().startOf('month').toDate();

  const [creditAggregate, user] = await Promise.all([
    prisma.creditLedger.aggregate({
      where: { userId, effectiveMonth },
      _sum: { change: true },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { isPro: true },
    }),
  ]);

  const ledgerSum = creditAggregate._sum.change ?? 0;
  const baseCredits = user?.isPro ? 4 : 3;
  const effectiveBalance = baseCredits + ledgerSum;

  return effectiveBalance;
}
