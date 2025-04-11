import { prisma } from '@/prisma';
import { dayjs } from '@/utils/dayjs';

export async function creditAggregate(userId: string) {
  const effectiveMonth = dayjs.utc().startOf('month').toDate();

  const creditAggregate = await prisma.creditLedger.aggregate({
    where: { userId, effectiveMonth },
    _sum: { change: true },
  });

  const ledgerSum = creditAggregate._sum.change ?? 0;
  const effectiveBalance = 3 + ledgerSum;

  return effectiveBalance;
}
