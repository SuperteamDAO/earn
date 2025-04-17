import type { NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithSponsor } from '@/features/auth/types';
import { checkListingSponsorAuth } from '@/features/auth/utils/checkListingSponsorAuth';
import { withSponsorAuth } from '@/features/auth/utils/withSponsorAuth';

async function handler(req: NextApiRequestWithSponsor, res: NextApiResponse) {
  const userId = req.userId;

  if (!userId) {
    logger.warn('Invalid token: User ID not found');
    return res.status(400).json({ error: 'Invalid token' });
  }

  logger.debug(`Request body: ${safeStringify(req.body)}`);
  const { id, label } = req.body;

  if (!id || !label) {
    logger.warn('Missing parameters: id and label are required');
    return res.status(400).json({ error: 'id and label are required' });
  }

  try {
    const currentSubmission = await prisma.submission.findUnique({
      where: { id },
    });

    if (!currentSubmission) {
      logger.warn(`Submission with ID ${id} not found`);
      return res.status(404).json({
        message: `Submission with ID ${id} not found.`,
      });
    }

    const userSponsorId = req.userSponsorId;

    const { error, listing } = await checkListingSponsorAuth(
      userSponsorId,
      currentSubmission.listingId,
    );
    if (error) {
      return res.status(error.status).json({ error: error.message });
    }

    if (listing?.isWinnersAnnounced && currentSubmission.isWinner) {
      return res.status(400).json({
        error: 'Cannot change label of an announced winner',
      });
    }

    let autoFixed = false;
    const updateData: any = { label };

    if (label === 'Spam' && currentSubmission.isWinner) {
      updateData.isWinner = false;
      updateData.winnerPosition = null;
      autoFixed = true;
      logger.info(
        `Automatically removing winner status from submission ${id} as it's being marked as Spam`,
      );
    }

    logger.debug(`Updating submission with ID: ${id} and label: ${label}`);

    const result = await prisma.submission.update({
      where: { id },
      data: updateData,
    });

    logger.info(`Successfully updated submission with ID: ${id}`);
    return res.status(200).json({ ...result, autoFixed });
  } catch (error: any) {
    logger.error(
      `Error occurred while updating submission with ID ${id}: ${error.message}`,
    );
    return res.status(500).json({
      error: error.message,
      message: 'Error occurred while updating the submission.',
    });
  }
}

export default withSponsorAuth(handler);
