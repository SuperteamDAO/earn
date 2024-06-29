import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { id, trancheAmount, txId = '', note = '' } = req.query;
  const parsedTrancheAmount = parseInt(trancheAmount as string, 10);

  try {
    const currentApplication = await prisma.grantApplication.findUnique({
      where: { id: id as string },
      include: { grant: true },
    });

    if (!currentApplication) {
      return res.status(404).json({ error: 'Grant application not found' });
    }

    let updatedPaymentDetails = currentApplication.paymentDetails || [];
    if (!Array.isArray(updatedPaymentDetails)) {
      updatedPaymentDetails = [];
    }

    updatedPaymentDetails.push({
      txId: txId || null,
      note: note || null,
      tranche: currentApplication.totalTranches + 1,
      amount: parsedTrancheAmount,
    });

    const result = await prisma.$transaction(async (tx) => {
      const updatedGrantApplication = await tx.grantApplication.update({
        where: { id: id as string },
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
