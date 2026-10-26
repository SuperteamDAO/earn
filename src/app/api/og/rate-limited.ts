import { NextResponse } from 'next/server';

import type * as RateLimits from '@/server/rate-limits';

// Earn's answer when a rate limit refuses a request.
export const rateLimited = (error: RateLimits.RateLimited) =>
  NextResponse.json(
    {
      message: 'Too many requests. Please wait before trying again.',
      retryAfter: error.retryAfterSeconds,
    },
    {
      status: 429,
      headers: { 'Retry-After': String(error.retryAfterSeconds) },
    },
  );
