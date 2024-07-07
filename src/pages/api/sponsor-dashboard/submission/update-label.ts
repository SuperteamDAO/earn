import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  const userId = req.userId;

  if (!userId) {
    logger.warn('Invalid token: User ID not found');
    return res.status(400).json({ error: 'Invalid token' });
  }

  const { id, label } = req.body;

  if (!id || !label) {
    logger.warn('Missing parameters: id and label are required');
    return res.status(400).json({ error: 'id and label are required' });
  }

  try {
    logger.debug(`Updating submission with ID: ${id} and label: ${label}`);

    const result = await prisma.submission.update({
      where: { id },
      data: { label },
    });

    logger.info(`Successfully updated submission with ID: ${id}`);
    return res.status(200).json(result);
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

export default withAuth(handler);
