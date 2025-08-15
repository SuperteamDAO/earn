/**
 * Twitter handle utilities and validation
 */

import { twitterUsernameRegex } from './regex';

const TWITTER_HOSTS = ['twitter.com', 'x.com'];

/**
 * Normalizes a Twitter handle
 * @param handle - Raw handle that may include @
 * @returns normalized handle (lowercase, no @)
 */
export function normalizeXHandle(handle: string): string {
  if (!handle || typeof handle !== 'string') {
    return '';
  }

  return handle.replace(/^@/, '').toLowerCase().trim();
}

/**
 * Extracts Twitter handle from a URL
 * @param url - The URL to extract handle from
 * @returns normalized handle or null if invalid
 */
export function extractXHandle(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  try {
    // Add protocol if missing
    const urlWithProtocol = url.startsWith('http') ? url : `https://${url}`;
    const parsedUrl = new URL(urlWithProtocol);

    // Check if host is supported
    if (!TWITTER_HOSTS.includes(parsedUrl.hostname.toLowerCase())) {
      return null;
    }

    // Extract handle from pathname (first segment after /)
    const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
    if (pathSegments.length === 0) {
      return null;
    }

    const handle = pathSegments[0];
    if (!handle) {
      return null;
    }

    // Validate handle format using regex
    if (!twitterUsernameRegex.test(handle)) {
      return null;
    }

    // Normalize handle
    return normalizeXHandle(handle);
  } catch {
    return null;
  }
}

/**
 * Checks if a URL contains a Twitter handle
 * @param url - URL to check
 * @returns boolean indicating if it's a Twitter URL
 */
export function isXUrl(url: string): boolean {
  return extractXHandle(url) !== null;
}

/**
 * Validates if a handle is in the verified list
 * @param handle - Handle to check
 * @param verifiedHandles - Array of verified handles
 * @returns boolean indicating if handle is verified
 */
export function isHandleVerified(
  handle: string,
  verifiedHandles: string[],
): boolean {
  if (!handle || !Array.isArray(verifiedHandles)) {
    return false;
  }

  const normalizedHandle = normalizeXHandle(handle);
  return verifiedHandles.includes(normalizedHandle);
}
