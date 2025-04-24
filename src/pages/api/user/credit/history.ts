import { type NextApiResponse } from 'next';

import { prisma } from '@/prisma';
import { dayjs } from '@/utils/dayjs';

import { type NextApiRequestWithUser } from '@/features/auth/types';
import { withAuth } from '@/features/auth/utils/withAuth';

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  const userId = req.userId;

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { createdAt: true },
  });

  const userCreatedAt = dayjs(user.createdAt).utc();
  const now = dayjs().utc();
  const startOfCurrentMonth = now.startOf('month');

  const effectiveMonths: Date[] = [];

  for (let i = 1; i >= -3; i--) {
    const month = startOfCurrentMonth.add(i, 'month');
    // only include months that are: apr25 and after or equal to the user's creation month
    const monthYear = month.year();
    const monthMonth = month.month();

    if (
      (monthYear > 2025 || (monthYear === 2025 && monthMonth >= 3)) &&
      !month.isBefore(userCreatedAt, 'month')
    ) {
      effectiveMonths.push(month.toDate());
    }
  }

  const creditHistory = await prisma.creditLedger.findMany({
    where: {
      userId,
      effectiveMonth: {
        in: effectiveMonths,
      },
    },
    orderBy: [{ effectiveMonth: 'desc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      createdAt: true,
      effectiveMonth: true,
      type: true,
      change: true,
      submission: {
        select: {
          listing: {
            select: {
              title: true,
              type: true,
              slug: true,
              sponsor: {
                select: {
                  name: true,
                  logo: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const groupedByMonth = new Map<string, typeof creditHistory>();
  for (const entry of creditHistory) {
    const key = dayjs(entry.effectiveMonth)
      .utc()
      .startOf('month')
      .toISOString();
    if (!groupedByMonth.has(key)) {
      groupedByMonth.set(key, []);
    }
    groupedByMonth.get(key)!.push(entry);
  }

  const syntheticEntries: any[] = [];
  const startOfCurrentMonthISO = startOfCurrentMonth.toISOString();

  for (const monthStart of effectiveMonths) {
    const monthKey = dayjs(monthStart).utc().startOf('month').toISOString();
    const entries = groupedByMonth.get(monthKey) ?? [];

    const ledgerSum = entries.reduce((sum, e) => sum + (e.change ?? 0), 0);

    if (
      monthKey !== startOfCurrentMonthISO &&
      dayjs(monthStart).isBefore(startOfCurrentMonth, 'month')
    ) {
      const effectiveBalance = 3 + ledgerSum;
      if (effectiveBalance > 0) {
        const monthEnd = dayjs(monthStart).endOf('month').toDate();
        syntheticEntries.push({
          id: `${monthKey}-expiry`,
          createdAt: monthEnd,
          type: 'CREDIT_EXPIRY',
          effectiveMonth: new Date(monthKey),
          change: -effectiveBalance,
          submission: {
            listing: {
              title: 'Remaining credits expired',
              type: '',
            },
          },
        });
      }
    }

    // determine the credit date - use user's creation date for their first month
    const isFirstMonth = dayjs(monthStart).isSame(userCreatedAt, 'month');
    const creditDate = isFirstMonth ? user.createdAt : new Date(monthKey);

    const isUpcomingMonth = dayjs(monthStart).isAfter(now, 'month');

    syntheticEntries.push({
      id: `${monthKey}-credit`,
      createdAt: creditDate,
      type: 'MONTHLY_CREDIT',
      effectiveMonth: new Date(monthKey),
      change: +3,
      submission: {
        listing: {
          title: isUpcomingMonth
            ? '3 Credits will be issued'
            : 'Added 3 credits to your balance',
          type: '',
        },
      },
    });
  }

  const combinedEntries = [...creditHistory, ...syntheticEntries];

  combinedEntries.sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return res.status(200).json(combinedEntries);
}

export default withAuth(handler);
