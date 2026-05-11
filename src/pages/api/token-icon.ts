import type { NextApiRequest, NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { safeStringify } from '@/utils/safeStringify';

const MAX_ICON_SIZE_BYTES = 5 * 1024 * 1024;
const UPSTREAM_FETCH_TIMEOUT_MS = 5000;
const CACHE_CONTROL =
  'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800';

const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^169\.254\./,
  /^0\./,
  /^\[?::1\]?$/i,
];

const isPrivateHost = (hostname: string) =>
  hostname.toLowerCase().endsWith('.localhost') ||
  PRIVATE_HOST_PATTERNS.some((pattern) => pattern.test(hostname));

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end();
  }

  const rawUrl = typeof req.query.url === 'string' ? req.query.url : '';

  let iconUrl: URL;
  try {
    iconUrl = new URL(rawUrl);
  } catch {
    return res.status(400).end();
  }

  if (!['https:', 'http:'].includes(iconUrl.protocol)) {
    return res.status(400).end();
  }

  if (isPrivateHost(iconUrl.hostname)) {
    return res.status(400).end();
  }

  const abortController = new AbortController();
  const timeout = setTimeout(
    () => abortController.abort(),
    UPSTREAM_FETCH_TIMEOUT_MS,
  );

  try {
    const iconResponse = await fetch(iconUrl, {
      redirect: 'follow',
      signal: abortController.signal,
      headers: {
        Accept:
          'image/avif,image/webp,image/png,image/jpeg,image/svg+xml,image/*',
      },
    });

    if (!iconResponse.ok) {
      return res.status(404).end();
    }

    const finalUrl = new URL(iconResponse.url);
    if (isPrivateHost(finalUrl.hostname)) {
      return res.status(400).end();
    }

    const contentType = iconResponse.headers.get('content-type') || '';
    if (!contentType.toLowerCase().startsWith('image/')) {
      return res.status(415).end();
    }

    const contentLength = Number(iconResponse.headers.get('content-length'));
    if (contentLength > MAX_ICON_SIZE_BYTES) {
      return res.status(413).end();
    }

    const icon = Buffer.from(await iconResponse.arrayBuffer());
    if (icon.byteLength > MAX_ICON_SIZE_BYTES) {
      return res.status(413).end();
    }

    res.setHeader('Cache-Control', CACHE_CONTROL);
    res.setHeader('Content-Type', contentType);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.status(200).send(icon);
  } catch (error) {
    logger.error(`Failed to proxy token icon: ${safeStringify(error)}`);
    return res.status(502).end();
  } finally {
    clearTimeout(timeout);
  }
}
