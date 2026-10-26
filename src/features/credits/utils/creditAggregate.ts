import { prisma } from '@/prisma';
import { dayjs } from '@/utils/dayjs';

type PrismaLike = Pick<typeof prisma, 'creditLedger'>;

export async function creditAggregate(
  userId: string,
  client: PrismaLike = prisma,
) {
  const effectiveMonth = dayjs.utc().startOf('month').toDate();

  const aggregate = await client.creditLedger.aggregate({
    where: { userId, effectiveMonth },
    _sum: { change: true },
  });

  const ledgerSum = aggregate._sum.change ?? 0;
  const baseCredits = 3;
  const effectiveBalance = baseCredits + ledgerSum;

  return effectiveBalance;
}
