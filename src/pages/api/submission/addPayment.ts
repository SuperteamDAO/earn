import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function user(req: NextApiRequest, res: NextApiResponse) {
  const { id, isPaid, paymentDetails } = req.body;
  try {
    const result = await prisma.submission.update({
      where: {
        id,
      },
      data: {
        isPaid,
        paymentDetails,
      },
    });
    const bountyId = result.listingId;
    const updatedBounty = {
      totalPaymentsMade: {},
    };
    if (isPaid) {
      updatedBounty.totalPaymentsMade = {
        increment: 1,
      };
    }
    await prisma.bounties.update({
      where: {
        id: bountyId,
      },
      data: {
        ...updatedBounty,
      },
    });
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      error,
      message: `Error occurred while updating payment of a submission ${id}.`,
    });
  }
}
