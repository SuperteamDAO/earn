import type { NextApiRequest, NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { safeStringify } from '@/utils/safeStringify';

import { fetchComments } from '@/features/comments/utils/fetchComments';

export default async function comment(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  logger.info(`Request Query: ${safeStringify(req.query)}`);

  const params = req.query;
  const refId = params.id as string;
  const skip = params.skip ? parseInt(params.skip as string, 10) : 0;
  const take = params.take ? parseInt(params.take as string, 10) : 0;

  logger.debug(`Fetching comments for listingId=${refId}, skip=${skip}`);

  try {
    const { count, result, validUsernames } = await fetchComments({
      refId,
      skip,
      take,
    });

    logger.info(
      `Fetched ${result.length} comments and count=${count} for listingId=${refId}`,
    );

    res.status(200).json({
      count,
      result,
      validUsernames,
    });
  } catch (error: any) {
    logger.error(
      `Error occurred while fetching comments for listingId=${refId}: ${safeStringify(error)}`,
    );
    res.status(400).json({
      error: 'Error occurred while fetching comments.',
      message: `Error occurred while fetching bounty with listingId=${refId}.`,
    });
  }
}
