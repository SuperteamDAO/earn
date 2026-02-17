import type { NextApiRequest, NextApiResponse } from 'next';

import { type SubmissionWithUser } from '@/interface/submission';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { convertDatesToISO, safeStringify } from '@/utils/safeStringify';

export async function getWinningSubmissionsByListingId(listingId: string) {
  if (!listingId) {
    throw new Error('Missing required query parameters: listingId');
  }

  const result = await prisma.submission.findMany({
    where: {
      listingId,
      isActive: true,
      isArchived: false,
      isWinner: true,
    },
    orderBy: { updatedAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          photo: true,
        },
      },
    },
  });

  result.sort((a, b) => {
    if (!a.winnerPosition) return 1;
    if (!b.winnerPosition) return -1;
    return Number(a.winnerPosition) - Number(b.winnerPosition);
  });

  return convertDatesToISO(result) as unknown as SubmissionWithUser[];
}

export default async function submission(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const params = req.query;
  const listingId = params.listingId as string;

  logger.debug(`Request query: ${safeStringify(req.query)}`);

  try {
    logger.debug(`Fetching winning submissions for listing ID: ${listingId}`);
    const result = await getWinningSubmissionsByListingId(listingId);

    logger.info(
      `Fetched ${result.length} winning submissions for listing ID: ${listingId}`,
    );
    res.status(200).json(result);
  } catch (error: any) {
    logger.error(
      `Error occurred while fetching winning submissions for listing ID=${listingId}: ${safeStringify(error)}`,
    );
    res.status(400).json({
      error: error.message,
      message: `Error occurred while fetching winning submissions for listing ID=${listingId}.`,
    });
  }
}
