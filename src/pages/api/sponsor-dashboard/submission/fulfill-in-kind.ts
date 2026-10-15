import type { NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithSponsor } from '@/features/auth/types';
import { checkListingSponsorAuth } from '@/features/auth/utils/checkListingSponsorAuth';
import { withSponsorAuth } from '@/features/auth/utils/withSponsorAuth';
import { fulfillInKindRewardRequestSchema } from '@/features/sponsor-dashboard/types';

async function handler(req: NextApiRequestWithSponsor, res: NextApiResponse) {
  if (req.method !== 'PATCH') {
    res.setHeader('Allow', ['PATCH']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const validationResult = fulfillInKindRewardRequestSchema.safeParse(req.body);
  if (!validationResult.success) {
    return res.status(400).json({
      error: 'Invalid request body',
      details: validationResult.error.flatten(),
    });
  }

  const { submissionId, reference, notes } = validationResult.data;

  try {
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      select: {
        id: true,
        listingId: true,
        isWinner: true,
        winnerPosition: true,
        user: {
          select: { isKYCVerified: true },
        },
        inKindFulfillment: {
          select: { quantity: true },
        },
        listing: {
          select: {
            rewardType: true,
            inKindRewardId: true,
            rewards: true,
            isWinnersAnnounced: true,
          },
        },
      },
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const { error } = await checkListingSponsorAuth(
      req.userSponsorId,
      submission.listingId,
    );
    if (error) {
      return res.status(error.status).json({ error: error.message });
    }

    if (
      submission.listing.rewardType !== 'IN_KIND' ||
      !submission.listing.inKindRewardId
    ) {
      return res.status(400).json({
        error: 'This submission does not belong to an in-kind reward listing',
      });
    }

    if (!submission.listing.isWinnersAnnounced || !submission.isWinner) {
      return res.status(400).json({
        error: 'Only announced winners can receive an in-kind reward',
      });
    }

    if (!submission.user.isKYCVerified) {
      return res.status(400).json({
        error: 'Winner must complete KYC before reward fulfillment',
      });
    }

    const rewards = submission.listing.rewards as Record<string, number> | null;
    const quantity =
      submission.inKindFulfillment?.quantity ??
      (submission.winnerPosition
        ? (rewards?.[String(submission.winnerPosition)] ?? 0)
        : 0);

    if (quantity <= 0) {
      return res.status(400).json({
        error: 'The winner does not have a valid reward quantity',
      });
    }

    const fulfilledAt = new Date();
    const [fulfillment] = await prisma.$transaction([
      prisma.inKindDelivery.upsert({
        where: { submissionId },
        create: {
          submissionId,
          inKindRewardId: submission.listing.inKindRewardId,
          quantity,
          status: 'FULFILLED',
          reference: reference || null,
          notes: notes || null,
          fulfilledAt,
          fulfilledById: req.userId,
        },
        update: {
          status: 'FULFILLED',
          reference: reference || null,
          notes: notes || null,
          fulfilledAt,
          fulfilledById: req.userId,
        },
        select: {
          id: true,
          quantity: true,
          status: true,
          reference: true,
          notes: true,
          fulfilledAt: true,
        },
      }),
      prisma.submission.update({
        where: { id: submissionId },
        data: { isPaid: true },
        select: { id: true },
      }),
    ]);

    return res.status(200).json(fulfillment);
  } catch (error) {
    logger.error(
      `Failed to fulfill in-kind reward for submission ${submissionId}: ${safeStringify(error)}`,
    );
    return res.status(500).json({ error: 'Unable to fulfill reward' });
  }
}

export default withSponsorAuth(handler);
