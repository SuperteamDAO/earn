import type { NextApiResponse } from 'next';
import { z } from 'zod';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithSponsor } from '@/features/auth/types';
import { checkGrantSponsorAuth } from '@/features/auth/utils/checkGrantSponsorAuth';
import { withSponsorAuth } from '@/features/auth/utils/withSponsorAuth';

const UpdateGrantTrancheSchema = z.object({
  id: z.string(),
  approvedAmount: z.union([z.number().int().min(0), z.null()]).optional(),
  status: z.enum(['Approved', 'Rejected']),
});

async function handler(req: NextApiRequestWithSponsor, res: NextApiResponse) {
  logger.debug(`Request body: ${safeStringify(req.body)}`);

  const validationResult = UpdateGrantTrancheSchema.safeParse(req.body);

  if (!validationResult.success) {
    const errorMessage = validationResult.error.errors
      .map((err) => `${err.path.join('.')}: ${err.message}`)
      .join(', ');
    logger.warn('Invalid request body:', errorMessage);
    return res.status(400).json({
      error: 'Invalid request body',
      details: errorMessage,
    });
  }

  const { id, status, approvedAmount } = validationResult.data;

  try {
    const currentTranche = await prisma.grantTranche.findUnique({
      where: { id },
      select: {
        grantId: true,
        applicationId: true,
      },
    });

    if (!currentTranche) {
      logger.warn(`tranche with ID ${id} not found`);
      return res.status(404).json({
        error: `tranche with ID ${id} not found`,
      });
    }

    const { error } = await checkGrantSponsorAuth(
      req.userSponsorId,
      currentTranche.grantId,
    );
    if (error) {
      return res.status(error.status).json({ error: error.message });
    }

    const updateData: any = {
      status,
      decidedAt: new Date().toISOString(),
      approvedAmount,
    };

    const application = await prisma.grantApplication.findUniqueOrThrow({
      where: { id: currentTranche.applicationId },
      select: {
        totalTranches: true,
        approvedAmount: true,
        totalPaid: true,
      },
    });

    let totalTranches = application.totalTranches;

    if (status === 'Approved') {
      const existingTranches = await prisma.grantTranche.count({
        where: {
          applicationId: currentTranche.applicationId,
        },
      });
      if (
        totalTranches - existingTranches === 0 &&
        application.totalPaid + approvedAmount! < application.approvedAmount
      ) {
        totalTranches! += 1;
      }
      await prisma.grantApplication.update({
        where: { id: currentTranche.applicationId },
        data: { totalTranches },
      });
    }

    const result = await prisma.grantTranche.update({
      where: { id },
      data: updateData,
      include: {
        GrantApplication: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                twitter: true,
                discord: true,
              },
            },
            grant: {
              select: {
                airtableId: true,
                isNative: true,
                title: true,
              },
            },
          },
        },
      },
    });

    return res.status(200).json(result);
  } catch (error: any) {
    logger.error(
      `Error occurred while updating grant tranche ID: ${id}:  ${error.message}`,
    );
    return res.status(500).json({
      error: error.message,
      message: 'Error occurred while updating the grant tranche.',
    });
  }
}

export default withSponsorAuth(handler);
