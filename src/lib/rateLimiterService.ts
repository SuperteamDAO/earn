import type { Ratelimit } from '@upstash/ratelimit';
import type { NextApiResponse } from 'next';
import { NextResponse } from 'next/server';

import logger from '@/lib/logger';
import { safeStringify } from '@/utils/safeStringify';

interface ApplyRateLimitOptions {
  limiter: Ratelimit;
  identifier: string;
  routeName: string; // for logging context
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
  error?: string;
}

interface RateLimitCheckResult {
  allowed: boolean;
  result?: RateLimitResult;
  error?: string;
}

/**
 * Core rate limiting function that checks limits and returns structured results.
 * This function doesn't send responses directly, making it reusable across different API types.
 */
async function checkRateLimit(
  options: ApplyRateLimitOptions,
): Promise<RateLimitCheckResult> {
  const { limiter, identifier, routeName } = options;

  if (!identifier) {
    logger.warn(
      `[RateLimiterService][${routeName}] Identifier not provided for rate limiting.`,
    );
    return {
      allowed: false,
      error: 'User identifier not available for rate limiting.',
    };
  }

  logger.info(
    `[RateLimiterService][${routeName}] Applying rate limit for identifier: "${identifier}"`,
  );

  try {
    const ratelimitResult = await limiter.limit(identifier);
    logger.info(
      `[RateLimiterService][${routeName}] Rate limit check for "${identifier}": ${safeStringify(ratelimitResult)}`,
    );

    const { success, limit, remaining, reset } = ratelimitResult;

    if (!success) {
      const retryAfter = Math.ceil((reset - Date.now()) / 1000);
      logger.warn(
        `[RateLimiterService][${routeName}] Rate limit EXCEEDED for "${identifier}". Details: ${safeStringify({ limit, remaining, reset, retryAfter })}`,
      );

      return {
        allowed: false,
        result: {
          success,
          limit,
          remaining,
          reset,
          retryAfter: retryAfter > 0 ? retryAfter : 1,
        },
      };
    }

    return {
      allowed: true,
      result: {
        success,
        limit,
        remaining,
        reset,
      },
    };
  } catch (error: any) {
    logger.error(
      `[RateLimiterService][${routeName}] CRITICAL ERROR for "${identifier}": ${safeStringify(error)}`,
    );
    return {
      allowed: false,
      error: 'Internal server error during rate limiting. Please try again.',
    };
  }
}

/**
 * Rate limiting function for Pages API endpoints.
 * Maintains backward compatibility with existing implementations.
 * Sets appropriate headers and sends a response if rate-limited or an error occurs.
 * @returns {Promise<boolean>} True if the request can proceed, false otherwise.
 */
export async function checkAndApplyRateLimit(
  res: NextApiResponse,
  options: ApplyRateLimitOptions,
): Promise<boolean> {
  const checkResult = await checkRateLimit(options);

  if (checkResult.result) {
    const { limit, remaining, reset } = checkResult.result;
    res.setHeader('X-RateLimit-Limit', limit.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    res.setHeader('X-RateLimit-Reset', Math.floor(reset / 1000).toString());
  }

  if (!checkResult.allowed) {
    if (checkResult.result?.retryAfter) {
      res.status(429).json({
        message: 'Too many requests. Please wait before trying again.',
        retryAfter: checkResult.result.retryAfter,
      });
    } else if (checkResult.error) {
      const statusCode = checkResult.error.includes('identifier') ? 400 : 500;
      res.status(statusCode).json({
        message: checkResult.error,
      });
    }
    return false;
  }

  return true;
}

/**
 * Rate limiting function for App Router API endpoints.
 * Returns a NextResponse with appropriate headers and status if rate-limited or an error occurs.
 * @returns {Promise<NextResponse | null>} NextResponse if rate-limited/error, null if request can proceed.
 */
export async function checkAndApplyRateLimitApp(
  options: ApplyRateLimitOptions,
): Promise<NextResponse | null> {
  const checkResult = await checkRateLimit(options);

  if (!checkResult.allowed) {
    const headers: Record<string, string> = {};

    if (checkResult.result) {
      const { limit, remaining, reset } = checkResult.result;
      headers['X-RateLimit-Limit'] = limit.toString();
      headers['X-RateLimit-Remaining'] = remaining.toString();
      headers['X-RateLimit-Reset'] = Math.floor(reset / 1000).toString();
    }

    if (checkResult.result?.retryAfter) {
      headers['Retry-After'] = checkResult.result.retryAfter.toString();
      return NextResponse.json(
        {
          message: 'Too many requests. Please wait before trying again.',
          retryAfter: checkResult.result.retryAfter,
        },
        { status: 429, headers },
      );
    } else if (checkResult.error) {
      const statusCode = checkResult.error.includes('identifier') ? 400 : 500;
      return NextResponse.json(
        {
          message: checkResult.error,
        },
        { status: statusCode, headers },
      );
    }
  }

  return null;
}
