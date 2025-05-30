import { Ratelimit } from '@upstash/ratelimit';

import { redis } from './redis';

export const commentRateLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.fixedWindow(10, '1 m'),
  analytics: true,
  prefix: 'ratelimit:comment_create',
});

export const aiGenerateRateLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.fixedWindow(20, '1 m'),
  analytics: true,
  prefix: 'ratelimit:ai_generate',
});

export const powCreateRateLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.fixedWindow(5, '1 h'),
  analytics: true,
  prefix: 'ratelimit:pow_create',
});
