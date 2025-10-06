import { Ratelimit } from '@upstash/ratelimit';

import { redis } from './redis';

export const commentCreateRateLimiter = new Ratelimit({
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

export const uploadSignatureRateLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.fixedWindow(10, '1 m'),
  analytics: true,
  prefix: 'ratelimit:upload_signature',
});

export const commentGetRateLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.fixedWindow(30, '1 m'),
  analytics: true,
  prefix: 'ratelimit:comment_get',
});

export const serverTimeRateLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.fixedWindow(30, '1 m'),
  analytics: true,
  prefix: 'ratelimit:server_time',
});
