import type { NextApiRequest, NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

export default async function user(req: NextApiRequest, res: NextApiResponse) {
  const { submissionId } = req.query as {
    submissionId: string;
    listingId: string;
  };
  logger.debug(`Request body: ${safeStringify(req.body)}`);

  if (!submissionId) {
    return res.status(400).json({
      message: 'submissionId are required in the request body.',
    });
  }

  try {
    const submission = await prisma.submission.findUnique({
      where: {
        id: submissionId,
      },
      include: {
        user: true,
      },
    });

    res.status(200).json(submission);
  } catch (error: any) {
    logger.error(
      `Error fetching submission with id=${submissionId}: ${error.message}`,
    );
    res.status(500).json({
      error: error.message,
      message: `Error occurred while fetching submission with id=${submissionId}.`,
    });
  }
}
