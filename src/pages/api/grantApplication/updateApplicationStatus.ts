import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import { prisma } from '@/prisma';

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  const userId = req.userId;

  if (!userId) {
    return res.status(400).json({ error: 'Invalid token' });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    return res.status(400).json({ error: 'User not found' });
  }

  const { id, applicationStatus, approvedAmount } = req.body;

  if (!id || !applicationStatus || approvedAmount === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const parsedAmount = parseInt(approvedAmount, 10);

  try {
    const currentApplication = await prisma.grantApplication.findUnique({
      where: {
        id,
      },
      include: {
        grant: true,
      },
    });

    if (user.currentSponsorId !== currentApplication?.grant.sponsorId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await prisma.grantApplication.update({
      where: {
        id,
      },
      data: {
        applicationStatus,
        approvedAmount: parsedAmount,
      },
    });

    await prisma.grants.update({
      where: {
        id: result.grantId,
      },
      data: {
        totalApproved: {
          increment: parsedAmount,
        },
      },
    });

    return res.status(200).json(result);
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({
      error: error.message,
      message: 'Error occurred while updating the grant application.',
    });
  }
}

export default withAuth(handler);
