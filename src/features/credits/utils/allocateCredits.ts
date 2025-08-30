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

export async function addReferralInviterWinBonus(
  inviterUserId: string,
  submissionId: string,
) {
  try {
    const existing = await prisma.creditLedger.findFirst({
      where: {
        userId: inviterUserId,
        submissionId,
        type: CreditEventType.REFERRAL_INVITEE_WIN_BONUS_INVITER,
      },
    });
    if (existing) return;

    await prisma.creditLedger.create({
      data: {
        userId: inviterUserId,
        submissionId,
        type: CreditEventType.REFERRAL_INVITEE_WIN_BONUS_INVITER,
        effectiveMonth: nextMonth,
        change: 1,
      },
    });
  } catch (error) {
    console.error(
      '[CreditAllocation] Failed to add referral invitee win bonus (inviter)',
      {
        inviterUserId,
        submissionId,
        error,
      },
    );
    throw error;
  }
}

export async function awardReferralFirstSubmissionBonusesForListing(
  listingId: string,
): Promise<void> {
  try {
    const submissions = await prisma.submission.findMany({
      where: {
        listingId,
        isActive: true,
        isArchived: false,
        label: { not: SubmissionLabels.Spam },
      },
      select: {
        id: true,
        userId: true,
        user: { select: { referredById: true } },
      },
    });

    const processedUserIds = new Set<string>();

    for (const submission of submissions) {
      const userId = submission.userId;
      if (processedUserIds.has(userId)) continue;
      processedUserIds.add(userId);

      const inviterUserId = submission.user?.referredById || undefined;
      if (!inviterUserId) continue;

      const earliest = await prisma.submission.findFirst({
        where: {
          userId,
          isActive: true,
          isArchived: false,
          label: { not: SubmissionLabels.Spam },
        },
        orderBy: { createdAt: 'asc' },
        select: { id: true, listingId: true },
      });

      if (!earliest || earliest.listingId !== listingId) {
        continue;
      }

      const inviteeBonusExists = await prisma.creditLedger.findFirst({
        where: {
          userId,
          type: CreditEventType.REFERRAL_FIRST_SUBMISSION_BONUS_INVITEE,
        },
      });

      if (!inviteeBonusExists) {
        await prisma.creditLedger.create({
          data: {
            userId,
            submissionId: earliest.id,
            type: CreditEventType.REFERRAL_FIRST_SUBMISSION_BONUS_INVITEE,
            effectiveMonth: nextMonth,
            change: 1,
          },
        });
      }

      const inviterBonusExists = await prisma.creditLedger.findFirst({
        where: {
          userId: inviterUserId,
          type: CreditEventType.REFERRAL_FIRST_SUBMISSION_BONUS_INVITER,
        },
      });

      if (!inviterBonusExists) {
        await prisma.creditLedger.create({
          data: {
            userId: inviterUserId,
            submissionId: earliest.id,
            type: CreditEventType.REFERRAL_FIRST_SUBMISSION_BONUS_INVITER,
            effectiveMonth: nextMonth,
            change: 1,
          },
        });
      }
    }
  } catch (error) {
    console.error(
      '[CreditAllocation] Failed to award referral first submission bonuses for listing',
      { listingId, error },
    );
    throw error;
  }
}
