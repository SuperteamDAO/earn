import type { NextApiRequest, NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils/safeStringify';

export default async function user(req: NextApiRequest, res: NextApiResponse) {
  const { submissionId, slug } = req.body;
  logger.debug(`Request body: ${safeStringify(req.body)}`);

  if (!submissionId || !slug) {
    return res.status(400).json({
      message: 'submissionId and slug are required in the request body.',
    });
  }

  try {
    const bounty = await prisma.bounties.findFirst({
      where: {
        slug,
        isActive: true,
      },
      include: {
        sponsor: true,
        poc: true,
        Hackathon: {
          select: {
            altLogo: true,
          },
        },
      },
    });

    if (!bounty) {
      return res.status(404).json({
        message: `Bounty with slug=${slug} not found.`,
      });
    }

    const submission = await prisma.submission.findUnique({
      where: {
        id: submissionId,
      },
      include: {
        user: true,
      },
    });

    res.status(200).json({
      bounty,
      submission,
    });
  } catch (error: any) {
    logger.error(
      `Error fetching bounty with slug=${slug} and submission with id=${submissionId}: ${error.message}`,
    );
    res.status(500).json({
      error: error.message,
      message: `Error occurred while fetching bounty with slug=${slug} and submission with id=${submissionId}.`,
    });
  }
}
