import { RATE_LIMIT_CONFIG } from '../config';

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const rateLimits = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL_MS = 60 * 1000;
let lastCleanup = Date.now();

function cleanupOldEntries(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;

  const windowMs = RATE_LIMIT_CONFIG.windowMs;
  for (const [userId, entry] of rateLimits.entries()) {
    if (entry.windowStart + windowMs * 2 < now) {
      rateLimits.delete(userId);
    }
  }
  lastCleanup = now;
}

export async function checkRateLimit(userId: string): Promise<RateLimitResult> {
  const now = Date.now();
  const windowMs = RATE_LIMIT_CONFIG.windowMs;
  const maxRequests = RATE_LIMIT_CONFIG.maxRequests;

  cleanupOldEntries();

  const existing = rateLimits.get(userId);

  if (!existing || existing.windowStart + windowMs < now) {
    rateLimits.set(userId, {
      count: 1,
      windowStart: now,
    });

    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: now + windowMs,
    };
  }

  if (existing.count >= maxRequests) {
    const resetAt = existing.windowStart + windowMs;
    const retryAfter = Math.ceil((resetAt - now) / 1000);

    return {
      allowed: false,
      remaining: 0,
      resetAt,
      retryAfter: retryAfter > 0 ? retryAfter : 1,
    };
  }

  existing.count += 1;
  rateLimits.set(userId, existing);

  return {
    allowed: true,
    remaining: maxRequests - existing.count,
    resetAt: existing.windowStart + windowMs,
  };
}

export function getRateLimitHeaders(result: RateLimitResult): HeadersInit {
  const headers: HeadersInit = {
    'X-RateLimit-Limit': RATE_LIMIT_CONFIG.maxRequests.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetAt / 1000).toString(),
  };

  if (result.retryAfter !== undefined) {
    headers['Retry-After'] = result.retryAfter.toString();
  }

  return headers;
}
