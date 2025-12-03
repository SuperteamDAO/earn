import type { ReadonlyHeaders } from 'next/dist/server/web/spec-extension/adapters/headers';

/**
 * Extracts client IP address from request headers.
 * Handles various proxy headers in order of reliability.
 * Returns 'unknown' as fallback to prevent rate limiting bypass.
 */
export function getClientIP(headers: ReadonlyHeaders): string {
  const xRealIP = headers.get('x-real-ip');
  if (xRealIP) {
    return xRealIP.split(',')[0]?.trim() || 'unknown';
  }

  const cfConnectingIP = headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP.trim();
  }

  const xForwardedFor = headers.get('x-forwarded-for');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0]?.trim() || 'unknown';
  }

  return 'unknown';
}
