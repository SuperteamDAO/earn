import type { NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { plainTextFromHtmlTurndown } from '@/utils/plainTextFromHtml';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithSponsor } from '@/features/auth/types';
import { checkGrantSponsorAuth } from '@/features/auth/utils/checkGrantSponsorAuth';
import { withSponsorAuth } from '@/features/auth/utils/withSponsorAuth';

const MAX_NOTES_LENGTH = 2000;

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

  const notesTextLength =
    typeof notes === 'string'
      ? plainTextFromHtmlTurndown.turndown(notes).length
      : 0;

  if (typeof notes !== 'string' || notesTextLength > MAX_NOTES_LENGTH) {
    logger.warn(`Invalid notes length for application with ID ${id}`);
    return res.status(400).json({
      error: `notes must be a string of ${MAX_NOTES_LENGTH} characters or fewer`,
    });
  }

  try {
    const currentApplication = await prisma.grantApplication.findUnique({
      where: { id },
    });

    if (!currentApplication) {
      logger.warn(`Application with ID ${id} not found`);
      return res.status(404).json({
        message: `Application with ID ${id} not found.`,
      });
    }

    const userSponsorId = req.userSponsorId;

    const { error } = await checkGrantSponsorAuth(
      userSponsorId,
      currentApplication.grantId,
    );
    if (error) {
      return res.status(error.status).json({ error: error.message });
    }

    logger.debug(`Updating application with ID: ${id} with notes`);

    const result = await prisma.grantApplication.update({
      where: { id },
      data: { notes },
    });

    logger.info(`Successfully updated application with ID: ${id} with notes`);
    return res.status(200).json(result);
  } catch (error: any) {
    logger.error(
      `Error occurred while updating application with ID ${id} with notes: ${error.message}`,
    );
    return res.status(500).json({
      error: error.message,
      message: 'Error occurred while updating the application with notes.',
    });
  }
}

export default withSponsorAuth(handler);
