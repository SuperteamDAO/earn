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

  const { id, trancheAmount, txId } = req.body;

  try {
    const currentApplication = await prisma.grantApplication.findUnique({
      where: { id },
    });

    if (!currentApplication) {
      return res.status(404).json({ error: 'Grant application not found' });
    }

    let updatedPaymentDetails;
    if (currentApplication.paymentDetails) {
      if (Array.isArray(currentApplication.paymentDetails)) {
        updatedPaymentDetails = [
          ...currentApplication.paymentDetails,
          { txId },
        ];
      } else {
        updatedPaymentDetails = [{ txId }];
      }
    } else {
      updatedPaymentDetails = [{ txId }];
    }

    const result = await prisma.grantApplication.update({
      where: {
        id,
        grant: {
          sponsorId: user.currentSponsorId!,
        },
      },
      data: {
        totalPaid: {
          increment: trancheAmount,
        },
        totalTranches: {
          increment: 1,
        },
        paymentDetails: updatedPaymentDetails as any,
      },
    });

    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      error,
      message: `Error occurred while updating payment of a submission ${id}.`,
    });
  }
}

export default withAuth(handler);
