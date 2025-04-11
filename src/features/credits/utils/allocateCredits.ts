import { CreditEventType, SubmissionLabels } from '@prisma/client';

import { prisma } from '@/prisma';
import { dayjs } from '@/utils/dayjs';

export async function consumeCredit(userId: string, submissionId: string) {
  const effectiveMonth = dayjs.utc().startOf('month').toDate();

  await prisma.creditLedger.create({
    data: {
      userId,
      submissionId,
      type: CreditEventType.SUBMISSION,
      effectiveMonth,
      change: -1,
    },
  });
}

export async function addWinBonusCredit(userId: string, submissionId: string) {
  const effectiveMonth = dayjs.utc().add(1, 'month').startOf('month').toDate();

  await prisma.creditLedger.create({
    data: {
      userId,
      submissionId,
      type: CreditEventType.WIN_BONUS,
      effectiveMonth,
      change: 1,
    },
  });
}

export async function addSpamPenaltyCredit(listingId: string) {
  const effectiveMonth = dayjs.utc().add(1, 'month').startOf('month').toDate();

  const submissions = await prisma.submission.findMany({
    where: {
      listingId,
      label: SubmissionLabels.Spam,
    },
    select: {
      id: true,
      userId: true,
    },
  });

  await Promise.all(
    submissions.map((submission) =>
      prisma.creditLedger.create({
        data: {
          userId: submission.userId,
          submissionId: submission.id,
          type: CreditEventType.SPAM_PENALTY,
          effectiveMonth,
          change: -1,
        },
      }),
    ),
  );
}
