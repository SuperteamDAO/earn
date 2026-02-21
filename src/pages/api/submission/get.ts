import type { NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';

import { type NextApiRequestWithUser } from '@/features/auth/types';
import { withAuth } from '@/features/auth/utils/withAuth';

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
      omit: {
        ai: true,
        label: true,
        notes: true,
        paymentDetails: true,
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
