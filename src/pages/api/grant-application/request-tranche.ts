import type { NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithUser } from '@/features/auth/types';
import { withAuth } from '@/features/auth/utils/withAuth';

async function requestTranche(
  req: NextApiRequestWithUser,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const userId = req.userId;
    const { applicationId } = req.body;
    logger.debug(`Request body: ${safeStringify(req.body)}`);
    logger.debug(`User ID: ${userId}`);

    if (!applicationId) {
      return res.status(400).json({ message: 'Application ID is required' });
    }

    const application = await prisma.grantApplication.findUnique({
      where: { id: applicationId },
      include: {
        GrantTranche: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const existingTranches = application.GrantTranche.length;
    const maxTranches = application.approvedAmount > 5000 ? 3 : 2;

    if (existingTranches >= maxTranches) {
      return res
        .status(400)
        .json({ message: 'All tranches have already been created' });
    }

    if (existingTranches > 0) {
      const previousTranche = application.GrantTranche[existingTranches - 1];
      if (previousTranche && previousTranche.status !== 'PAID') {
        return res.status(400).json({
          message:
            'Previous tranche must be paid before requesting a new tranche',
        });
      }
    }

    let trancheAmount;
    if (application.approvedAmount <= 5000) {
      trancheAmount = application.approvedAmount * 0.5;
    } else {
      if (existingTranches === 0) {
        trancheAmount = application.approvedAmount * 0.3;
      } else if (existingTranches === 1) {
        trancheAmount = application.approvedAmount * 0.3;
      } else {
        trancheAmount = application.approvedAmount * 0.4;
      }
    }

    const newTranche = await prisma.grantTranche.create({
      data: {
        amount: trancheAmount,
        status: 'PENDING',
        applicationId,
        grantId: application.grantId,
      },
    });

    return res.status(200).json(newTranche);
  } catch (error: any) {
    logger.error(
      `Error creating tranche for application=${req.body.applicationId}, user=${req.userId}: ${error.message}`,
    );
    return res.status(500).json({
      error: error.message,
      message: 'Error occurred while creating tranche.',
    });
  }
}

export default withAuth(requestTranche);
