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

export const userCreateRateLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.fixedWindow(60, '1 h'),
  analytics: true,
  prefix: 'ratelimit:user_create',
});

export const ogMetadataRateLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.fixedWindow(60, '1 m'),
  analytics: true,
  prefix: 'ratelimit:og_metadata',
});

export const ogImageUpdateRateLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.fixedWindow(30, '1 m'),
  analytics: true,
  prefix: 'ratelimit:og_image_update',
});

export const supportEmailRateLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.fixedWindow(5, '1 h'),
  analytics: true,
  prefix: 'ratelimit:support_email',
});

export const emailValidateRateLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  analytics: true,
  prefix: 'ratelimit:email_validate',
});

export const emailValidateHourlyRateLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.fixedWindow(100, '1 h'),
  analytics: true,
  prefix: 'ratelimit:email_validate_hourly',
});

export const reportListingRateLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.fixedWindow(5, '1 h'),
  analytics: true,
  prefix: 'ratelimit:report_listing',
});
