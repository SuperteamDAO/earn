import type { NextApiRequest, NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { getProposalStatus } from '@/utils/near';
import { safeStringify } from '@/utils/safeStringify';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  logger.debug(`Request body: ${safeStringify(req.body)}`);
  const { id } = req.body;

  try {
    const currentSubmission = await prisma.submission.findUnique({
      where: { id },
      include: {
        listing: {
          include: {
            sponsor: true,
          },
        },
      },
    });

    if (!currentSubmission) {
      logger.warn(`Submission with ID ${id} not found`);
      return res.status(404).json({
        message: `Submission with ID ${id} not found.`,
      });
    }

    const paymentDetails = currentSubmission.paymentDetails as any;
    if (
      !paymentDetails?.treasury?.dao ||
      !paymentDetails?.treasury?.proposalId
    ) {
      logger.warn('No treasury proposal found for submission');
      return res.status(400).json({
        error: 'No treasury proposal found',
        message: 'No treasury proposal found for this submission',
      });
    }

    logger.debug(`Getting proposal status for submission ID: ${id}`);
    const proposalStatus = await getProposalStatus(
      paymentDetails.treasury.dao,
      paymentDetails.treasury.proposalId,
    );

    if (proposalStatus === 'Approved' && !currentSubmission.isPaid) {
      logger.debug(`Updating submission with ID: ${id} to paid status`);
      await prisma.submission.update({
        where: { id },
        data: {
          isPaid: true,
          paymentDetails: {
            link: paymentDetails.treasury.link,
          },
        },
      });
      logger.info(`Successfully updated submission ID: ${id} to paid status`);
    }

    return res.status(200).json({
      message: 'Treasury status synced successfully',
      status: proposalStatus,
    });
  } catch (error: any) {
    logger.error(
      `Error syncing treasury status for submission ${id}: ${safeStringify(
        error,
      )}`,
    );
    return res.status(400).json({
      error: error.message,
      message: `Error occurred while syncing treasury status for submission ${id}.`,
    });
  }
}
