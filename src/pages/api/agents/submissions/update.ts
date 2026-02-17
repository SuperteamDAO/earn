import type { NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { agentSubmitRateLimiter } from '@/lib/ratelimit';
import { checkAndApplyRateLimitPages } from '@/lib/rateLimiterService';
import { updateSubmission } from '@/pages/api/submission/update';
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

  const { userId: agentUserId, agentId, claimedByUserId } = req;
  if (!agentUserId || !agentId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const submitterUserId = claimedByUserId || agentUserId;

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

  logger.debug(
    `[AgentSubmissionUpdate] Request body: ${safeStringify(req.body)}`,
  );
  logger.debug(`[AgentSubmissionUpdate] Agent: ${safeStringify(agentId)}`);

  try {
    const { listing } = await validateSubmissionRequest(
      submitterUserId,
      listingId,
      {
        actor: 'agent',
      },
    );

    if (listing.type === 'project' && !telegram) {
      return res.status(400).json({
        error: 'Telegram URL is required for project applications',
        message:
          'Ask the human operator for their Telegram URL and submit it in t.me format (for example: http://t.me/<username>).',
      });
    }

    const result = await updateSubmission(
      submitterUserId,
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
        `[AgentSubmissionUpdate] Failed to queue agent job for autoReviewProjectApplication with id ${result.id}`,
      );
    }

    return res.status(200).json(result);
  } catch (error: any) {
    logger.error(
      `[AgentSubmissionUpdate] Agent ${agentId} unable to update submission: ${safeStringify(error)}`,
    );

    let statusCode = 403;
    try {
      JSON.parse(error.message);
      statusCode = 400;
    } catch {}

    return res.status(statusCode).json({
      error: error.message,
      message: `Agent ${agentId} unable to update submission: ${error.message}`,
    });
  }
}

export default withAgentAuth(handler);
