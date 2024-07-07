import type { NextApiRequest, NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    logger.warn('Invalid request: ID is required and must be a string');
    return res
      .status(400)
      .json({ error: 'ID is required and must be a string' });
  }

  try {
    const result = await prisma.grantApplication.update({
      where: { id },
      data: {
        isShipped: true,
      },
    });

    if (!result) {
      logger.warn(`Grant application with ID ${id} not found`);
      return res.status(404).json({ error: 'Grant application not found' });
    }

    return res.status(200).json(result);
  } catch (error: any) {
    logger.error(
      `Error updating grant application with ID ${id}: ${error.message}`,
    );
    return res.status(500).json({
      error: error.message,
      message: 'Error occurred while updating the grant application.',
    });
  }
}

export default handler;
