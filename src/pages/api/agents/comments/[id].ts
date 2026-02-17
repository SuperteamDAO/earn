import type { NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithAgent } from '@/features/auth/types';
import { withAgentAuth } from '@/features/auth/utils/withAgentAuth';
import { fetchComments } from '@/features/comments/utils/fetchComments';

async function handler(req: NextApiRequestWithAgent, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const params = req.query;
  const refId = params.id as string;
  const skip = params.skip ? parseInt(params.skip as string, 10) : 0;
  const take = params.take ? parseInt(params.take as string, 10) : 0;

  logger.debug(
    `[AgentComment] Fetching comments for refId=${refId}, skip=${skip}`,
  );

  try {
    const { count, result, validUsernames } = await fetchComments({
      refId,
      skip,
      take,
    });

    logger.info(
      `[AgentComment] Fetched ${result.length} comments and count=${count} for refId=${refId}`,
    );

    return res.status(200).json({
      count,
      result,
      validUsernames,
    });
  } catch (error: any) {
    logger.error(
      `[AgentComment] Error occurred while fetching comments for refId=${refId}: ${safeStringify(error)}`,
    );
    return res.status(400).json({
      error: 'Error occurred while fetching comments.',
      message: `Error occurred while fetching comments for refId=${refId}.`,
    });
  }
}

export default withAgentAuth(handler);
