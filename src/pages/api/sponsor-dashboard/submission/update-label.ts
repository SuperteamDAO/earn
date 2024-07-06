import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  const userId = req.userId;

  if (!userId) {
    return res.status(400).json({ error: 'Invalid token' });
  }

  const { id, label } = req.body;

  try {
    const result = await prisma.submission.update({
      where: {
        id,
      },
      data: {
        label,
      },
    });

    return res.status(200).json(result);
  } catch (error) {
    logger.error(error);
    return res.status(400).json({
      error,
      message: 'Error occurred while updating the submission.',
    });
  }
}

export default withAuth(handler);
