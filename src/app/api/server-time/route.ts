import { ipAddress } from '@vercel/functions';
import { type NextRequest } from 'next/server';

import logger from '@/lib/logger';
import { serverTimeRateLimiter } from '@/lib/ratelimit';
import { checkAndApplyRateLimitApp } from '@/lib/rateLimiterService';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const identifier = ipAddress(request) || 'unknown';
  const rateLimitResponse = await checkAndApplyRateLimitApp({
    limiter: serverTimeRateLimiter,
    identifier,
    routeName: 'serverTime',
  });
  if (rateLimitResponse) {
    logger.warn('Rate limit exceeded for server time', { identifier });
    return rateLimitResponse;
  }

  if (process.env.IS_LOCAL === 'true') {
    try {
      const response = await fetch('https://httpbin.org/get', {
        method: 'HEAD',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch external time');
      }

      const dateHeader = response.headers.get('date');
      if (!dateHeader) {
        throw new Error('No date header in response');
      }

      const externalTime = new Date(dateHeader).getTime();

      return Response.json({
        timestamp: externalTime,
        iso: new Date(externalTime).toISOString(),
        timezone: 'UTC',
      });
    } catch (error) {
      console.error(
        'External time service failed, falling back to system time:',
        error,
      );
      return Response.json({
        timestamp: Date.now(),
        iso: new Date().toISOString(),
        timezone: process.env.TZ || 'UTC',
      });
    }
  } else {
    return Response.json({
      timestamp: Date.now(),
      iso: new Date().toISOString(),
      timezone: process.env.TZ || 'UTC',
    });
  }
}
