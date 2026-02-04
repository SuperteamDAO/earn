import type { NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { agentSubmitRateLimiter } from '@/lib/ratelimit';
import { checkAndApplyRateLimitPages } from '@/lib/rateLimiterService';
import { createSubmission } from '@/pages/api/submission/create';
import { safeStringify } from '@/utils/safeStringify';

import { queueAgent } from '@/features/agents/utils/queueAgent';
import { type NextApiRequestWithAgent } from '@/features/auth/types';
import { withAgentAuth } from '@/features/auth/utils/withAgentAuth';
import { validateSubmissionRequest } from '@/features/listings/utils/validateSubmissionRequest';
import { extractSocialUsername } from '@/features/social/utils/extractUsername';

async function handler(req: NextApiRequestWithAgent, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { userId, agentId } = req;
  if (!userId || !agentId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const rateLimitAllowed = await checkAndApplyRateLimitPages({
    limiter: agentSubmitRateLimiter,
    identifier: agentId,
    routeName: 'agent_submit',
    res,
  });
  if (!rateLimitAllowed) return;

  const {
    listingId,
    link,
    tweet,
    otherInfo,
    eligibilityAnswers,
    ask,
    telegram: telegramUsername,
  } = req.body;

  if (!listingId) {
    return res.status(400).json({
      error: 'Missing required field',
      message: 'Listing ID is required',
    });
  }

  const telegram = extractSocialUsername('telegram', telegramUsername);

  logger.debug(`[AgentSubmission] Request body: ${safeStringify(req.body)}`);
  logger.debug(`[AgentSubmission] Agent: ${safeStringify(agentId)}`);

  try {
    const { listing } = await validateSubmissionRequest(userId, listingId, {
      actor: 'agent',
    });

    const result = await createSubmission(
      userId,
      listingId,
      { link, tweet, otherInfo, eligibilityAnswers, ask, telegram },
      listing,
      { isAgent: true, agentId },
    );

    try {
      if (listing.type === 'project') {
        await queueAgent({
          type: 'autoReviewProjectApplication',
          id: result.id,
        });
      }
    } catch (err) {
      logger.error(
        `[AgentSubmission] Failed to queue agent job for autoReviewProjectApplication with id ${result.id}`,
      );
    }

    return res.status(200).json(result);
  } catch (error: any) {
    const statusCode = error.message?.includes('Validation') ? 400 : 403;
    logger.error(
      `[AgentSubmission] Agent ${agentId} unable to submit: ${safeStringify(error)}`,
    );

    return res.status(statusCode).json({
      error: error.message,
      message: `Agent ${agentId} unable to submit: ${error.message}`,
    });
  }
}

export default withAgentAuth(handler);
