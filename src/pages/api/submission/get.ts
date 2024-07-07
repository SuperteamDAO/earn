import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';

async function submission(req: NextApiRequestWithUser, res: NextApiResponse) {
  const userId = req.userId;
  const id = req.query.id as string;

  if (!id) {
    return res.status(400).json({
      message: 'Listing ID is required in the query parameters.',
    });
  }

  try {
    const result = await prisma.submission.findFirst({
      where: {
        userId,
        listingId: id,
      },
    });

    if (!result) {
      return res.status(404).json({
        message: `Submission for user=${userId} and listingId=${id} not found.`,
      });
    }

    return res.status(200).json(result);
  } catch (error: any) {
    logger.error(
      `Error fetching submission for user=${userId} and listingId=${id}: ${error.message}`,
    );
    return res.status(500).json({
      error: error.message,
      message: 'Error occurred while getting the submission.',
    });
  }
}

export default withAuth(submission);
