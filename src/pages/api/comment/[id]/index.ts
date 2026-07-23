import type { NextApiRequest, NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { parseBoundedIntegerParam } from '@/utils/apiPagination';
import { safeStringify } from '@/utils/safeStringify';

import { fetchComments } from '@/features/comments/utils/fetchComments';

export default async function comment(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  logger.info(`Request Query: ${safeStringify(req.query)}`);

  const params = req.query;
  const refId = params.id as string;
  const skipResult = parseBoundedIntegerParam(params.skip, {
    defaultValue: 0,
    maxValue: 1000,
    name: 'skip',
  });
  const takeResult = parseBoundedIntegerParam(params.take, {
    defaultValue: 10,
    maxValue: 50,
    name: 'take',
  });

  if (!skipResult.ok) {
    return res.status(400).json({ error: skipResult.error });
  }
  if (!takeResult.ok) {
    return res.status(400).json({ error: takeResult.error });
  }

  const skip = skipResult.value;
  const take = takeResult.value;

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
