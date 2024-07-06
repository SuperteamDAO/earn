import type { NextApiRequest, NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const result = await prisma.subscribeHackathon.update({
      where: {
        id: req.body.id,
      },
      data: {
        isArchived: true,
      },
    });
    res.status(200).json(result);
  } catch (error) {
    logger.error(error);
    res.status(400).json({
      error,
      message: 'Error occurred while adding a new bounty.',
    });
  }
}
