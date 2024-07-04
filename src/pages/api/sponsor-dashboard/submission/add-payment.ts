import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import { sendEmailNotification } from '@/features/emails';
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

  const { id, isPaid, paymentDetails } = req.body;
  try {
    const currentSubmission = await prisma.submission.findUnique({
      where: { id },
      include: { listing: true, user: true },
    });

    if (!currentSubmission) {
      return res.status(404).json({
        message: `Submission with ID ${id} not found.`,
      });
    }

    if (user.currentSponsorId !== currentSubmission.listing.sponsorId) {
      return res.status(403).json({
        message: 'Unauthorized',
      });
    }

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
      await sendEmailNotification({
        type: 'addPayment',
        id,
        triggeredBy: userId,
      });
    }
    await prisma.bounties.update({
      where: {
        id: bountyId,
      },
      data: {
        ...updatedBounty,
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
