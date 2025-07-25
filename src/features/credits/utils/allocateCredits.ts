import { CreditEventType, SubmissionLabels } from '@prisma/client';

import { prisma } from '@/prisma';
import { dayjs } from '@/utils/dayjs';

const currentMonth = dayjs.utc().startOf('month').toDate();
const nextMonth = dayjs.utc().add(1, 'month').startOf('month').toDate();

export async function consumeCredit(userId: string, submissionId: string) {
  try {
    await prisma.creditLedger.create({
      data: {
        userId,
        submissionId,
        type: CreditEventType.SUBMISSION,
        effectiveMonth: currentMonth,
        change: -1,
      },
    });
  } catch (error) {
    console.error('[CreditAllocation] Failed to consume credit', {
      userId,
      submissionId,
      error,
    });
    throw error;
  }
}

export async function addWinBonusCredit(userId: string, submissionId: string) {
  try {
    await prisma.creditLedger.create({
      data: {
        userId,
        submissionId,
        type: CreditEventType.WIN_BONUS,
        effectiveMonth: nextMonth,
        change: 1,
      },
    });
  } catch (error) {
    console.error('[CreditAllocation] Failed to add win bonus credit', {
      userId,
      submissionId,
      error,
    });
    throw error;
  }
}

export async function addGrantWinBonusCredit(
  userId: string,
  applicationId: string,
) {
  await prisma.creditLedger.create({
    data: {
      userId,
      applicationId,
      type: CreditEventType.GRANT_WIN_BONUS,
      effectiveMonth: nextMonth,
      change: 1,
    },
  });
}

export async function addSpamPenaltyCredit(submissionId: string) {
  try {
    const submission = await prisma.submission.findFirst({
      where: { id: submissionId, label: SubmissionLabels.Spam },
      select: { id: true, userId: true },
    });

    if (!submission) {
      throw new Error('Submission not found');
    }

    await prisma.creditLedger.create({
      data: {
        userId: submission.userId,
        submissionId: submission.id,
        type: CreditEventType.SPAM_PENALTY,
        effectiveMonth: nextMonth,
        change: -1,
      },
    });
  } catch (error) {
    console.error('[CreditAllocation] Failed to add spam penalty credit', {
      submissionId,
      error,
    });
    throw error;
  }
}

export async function addSpamPenaltyGrant(
  userId: string,
  applicationId: string,
) {
  await prisma.creditLedger.create({
    data: {
      userId,
      applicationId,
      type: CreditEventType.GRANT_SPAM_PENALTY,
      effectiveMonth: nextMonth,
      change: -1,
    },
  });
}

export async function addCreditDispute(
  userId: string,
  type: CreditEventType,
  id: string,
) {
  if (type === CreditEventType.SPAM_DISPUTE) {
    await prisma.creditLedger.create({
      data: {
        userId,
        type: CreditEventType.SPAM_DISPUTE,
        effectiveMonth: nextMonth,
        change: 0,
        submissionId: id,
        decision: 'Pending',
      },
    });
  } else if (type === CreditEventType.GRANT_SPAM_DISPUTE) {
    await prisma.creditLedger.create({
      data: {
        userId,
        type: CreditEventType.GRANT_SPAM_DISPUTE,
        effectiveMonth: nextMonth,
        change: 0,
        applicationId: id,
        decision: 'Pending',
      },
    });
  }
}

export async function refundCredits(listingId: string) {
  try {
    const submissions = await prisma.submission.findMany({
      where: { listingId },
      select: { id: true, userId: true },
    });

    await Promise.all(
      submissions.map((submission) =>
        prisma.creditLedger.create({
          data: {
            userId: submission.userId,
            submissionId: submission.id,
            type: CreditEventType.CREDIT_REFUND,
            effectiveMonth: nextMonth,
            change: +1,
          },
        }),
      ),
    );
  } catch (error) {
    console.error('[CreditAllocation] Failed to refund credit', {
      listingId,
      error,
    });
    throw error;
  }
}
