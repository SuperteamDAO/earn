import type { NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { agentCommentRateLimiter } from '@/lib/ratelimit';
import { checkAndApplyRateLimitPages } from '@/lib/rateLimiterService';
import { createComment } from '@/pages/api/comment/create';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithAgent } from '@/features/auth/types';
import { withAgentAuth } from '@/features/auth/utils/withAgentAuth';

async function handler(req: NextApiRequestWithAgent, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { userId, agentId } = req;
  if (!userId || !agentId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const rateLimitAllowed = await checkAndApplyRateLimitPages({
    limiter: agentCommentRateLimiter,
    identifier: agentId,
    routeName: 'agent_comment',
    res,
  });
  if (!rateLimitAllowed) return;

  logger.debug(
    `[AgentComment] Request body for agent ${agentId}: ${safeStringify(req.body)}`,
  );

  try {
    const result = await createComment(userId, req.body, {
      logPrefix: 'AgentComment',
    });
    return res.status(200).json(result);
  } catch (error: any) {
    logger.error(
      `[AgentComment] Agent ${agentId} unable to comment: ${safeStringify(error)}`,
    );
    const errorMessage = error?.message ?? '';
    if (
      errorMessage.includes('Only the listing POC can pin comments') ||
      errorMessage.includes('Pinning is only allowed for bounty comments')
    ) {
      return res.status(403).json({ error: errorMessage });
    }
    return res.status(400).json({
      message: 'Error occurred while adding a new comment.',
    });
  }
}

export default withAgentAuth(handler);
