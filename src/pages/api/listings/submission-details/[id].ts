import type { NextApiRequest, NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

export default async function user(req: NextApiRequest, res: NextApiResponse) {
  const params = req.query;
  const submissionId = params.id as string;

  logger.debug(`Request query: ${safeStringify(req.query)}`);

  try {
    logger.debug(`Fetching submission with id: ${submissionId}`);
    const submission = await prisma.submission.findUnique({
      where: {
        id: submissionId,
      },
      include: {
        user: true,
        listing: true,
      },
    });

    if (!submission) {
      return res.status(404).json({
        error: 'Submission not found',
      });
    }

    if (
      submission.listing.isWinnersAnnounced === false &&
      submission.listing.type !== 'sponsorship'
    ) {
      logger.info('Winners have not been announced yet');
      return res.status(200).json({
        submission: null,
      });
    }

    return res.status(200).json({
      submission: {
        ...submission,
        listing: undefined,
      },
      listing: submission.listing,
    });
  } catch (error: any) {
    logger.error(
      `Error occurred while fetching submission with id=${submissionId}: ${safeStringify(error)}`,
    );
    return res.status(400).json({
      error: error.message,
      message: `Error occurred while fetching submission with id=${submissionId}.`,
    });
  }
}
