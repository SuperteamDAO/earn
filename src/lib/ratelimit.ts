import { Ratelimit } from '@upstash/ratelimit';

import { redis } from './redis';

/**
 * Generic rate limiter for public API endpoints.
 * 30 requests per 10 seconds per IP - allows normal browsing while blocking abuse.
 * Uses sliding window for smoother rate limiting.
 */

export const aiGenerateRateLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.fixedWindow(20, '1 m'),
  analytics: true,
  prefix: 'ratelimit:ai_generate',
});

export const agentRegisterRateLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.fixedWindow(60, '1 h'),
  analytics: true,
  prefix: 'ratelimit:agent_register',
});

export const agentSubmitRateLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.fixedWindow(60, '1 h'),
  analytics: true,
  prefix: 'ratelimit:agent_submit',
});

export const agentCommentRateLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.fixedWindow(120, '1 h'),
  analytics: true,
  prefix: 'ratelimit:agent_comment',
});

export const agentClaimRateLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.fixedWindow(20, '10 m'),
  analytics: true,
  prefix: 'ratelimit:agent_claim',
});
