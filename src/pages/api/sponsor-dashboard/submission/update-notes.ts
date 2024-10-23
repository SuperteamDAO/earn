import type { NextApiResponse } from 'next';

import {
  checkListingSponsorAuth,
  type NextApiRequestWithSponsor,
  withSponsorAuth,
} from '@/features/auth';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

async function handler(req: NextApiRequestWithSponsor, res: NextApiResponse) {
  const userId = req.userId;

  if (!userId) {
    logger.warn('Invalid token: User ID not found');
    return res.status(400).json({ error: 'Invalid token' });
  }

  logger.debug(`Request body: ${safeStringify(req.body)}`);
  const { id, notes } = req.body;

  if (!id || notes === undefined) {
    logger.warn('Missing parameters: id and notes are required');
    return res.status(400).json({ error: 'id and notes are required' });
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

    const { error } = await checkListingSponsorAuth(
      userSponsorId,
      currentSubmission.listingId,
    );
    if (error) {
      return res.status(error.status).json({ error: error.message });
    }

    logger.debug(`Updating submission with ID: ${id} with notes`);

    const result = await prisma.submission.update({
      where: { id },
      data: { notes },
    });

    logger.info(`Successfully updated submission with ID: ${id} with notes`);
    return res.status(200).json(result);
  } catch (error: any) {
    logger.error(
      `Error occurred while updating submission with ID ${id} with notes: ${error.message}`,
    );
    return res.status(500).json({
      error: error.message,
      message: 'Error occurred while updating the submission with notes.',
    });
  }
}

export default withSponsorAuth(handler);
