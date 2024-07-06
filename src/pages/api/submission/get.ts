import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';

async function submission(req: NextApiRequestWithUser, res: NextApiResponse) {
  const userId = req.userId;

  const id = req.query.id as string;

  try {
    const result = await prisma.submission.findFirst({
      where: {
        userId,
        listingId: id,
      },
    });

    return res.status(200).json(result);
  } catch (error) {
    logger.error(error);
    return res.status(400).json({
      error,
      message: 'Error occurred while getting the submission.',
    });
  }
}

export default withAuth(submission);
