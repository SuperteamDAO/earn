import type { NextApiRequest } from 'next';

/**
 * Extracts client IP address from Pages API request headers.
 * Handles various proxy headers in order of reliability.
 * Returns 'unknown' as fallback to prevent rate limiting bypass.
 */
export function getClientIPPages(req: NextApiRequest): string {
  const xRealIP = req.headers['x-real-ip'];
  if (xRealIP) {
    const ip = Array.isArray(xRealIP) ? xRealIP[0] : xRealIP;
    return ip?.split(',')[0]?.trim() || 'unknown';
  }

  const cfConnectingIP = req.headers['cf-connecting-ip'];
  if (cfConnectingIP) {
    const ip = Array.isArray(cfConnectingIP)
      ? cfConnectingIP[0]
      : cfConnectingIP;
    return ip?.trim() || 'unknown';
  }

  const xForwardedFor = req.headers['x-forwarded-for'];
  if (xForwardedFor) {
    const ip = Array.isArray(xForwardedFor) ? xForwardedFor[0] : xForwardedFor;
    return ip?.split(',')[0]?.trim() || 'unknown';
  }

  return 'unknown';
}
