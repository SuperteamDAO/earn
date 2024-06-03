import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import { prisma } from '@/prisma';

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  const userId = req.userId;

  const user = await prisma.user.findUnique({
    where: {
      id: userId as string,
    },
  });

  if (!user) {
    return res.status(400).json({ error: 'Unauthorized' });
  }

  const { id, trancheAmount, txId, note } = req.body;
  const parsedTrancheAmount = parseInt(trancheAmount, 10);

  try {
    const currentApplication = await prisma.grantApplication.findUnique({
      where: { id },
      include: { grant: true },
    });

    if (!currentApplication) {
      return res.status(404).json({ error: 'Grant application not found' });
    }

    if (currentApplication.grant.sponsorId !== user.currentSponsorId) {
      return res.status(400).json({ error: 'Unauthorized' });
    }

    let updatedPaymentDetails = currentApplication.paymentDetails || [];
    if (!Array.isArray(updatedPaymentDetails)) {
      updatedPaymentDetails = [];
    }

    updatedPaymentDetails.push({
      txId,
      note,
      tranche: currentApplication.totalTranches + 1,
      amount: parsedTrancheAmount,
    });

    const result = await prisma.$transaction(async (tx) => {
      const updatedGrantApplication = await tx.grantApplication.update({
        where: { id },
        data: {
          totalPaid: {
            increment: parsedTrancheAmount,
          },
          totalTranches: {
            increment: 1,
          },
          paymentDetails: updatedPaymentDetails as any,
        },
      });

      await tx.grants.update({
        where: {
          id: currentApplication.grantId,
        },
        data: {
          totalPaid: {
            increment: parsedTrancheAmount,
          },
        },
      });

      await tx.sponsors.update({
        where: {
          id: user.currentSponsorId!,
        },
        data: {
          totalRewardedInUSD: {
            increment: parsedTrancheAmount,
          },
        },
      });

      return updatedGrantApplication;
    });

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({
      error: error.message,
      message: `Error occurred while updating payment of a submission ${id}.`,
    });
  }
}

export default withAuth(handler);
