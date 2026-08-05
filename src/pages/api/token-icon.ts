import type { NextApiRequest, NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { isSafeRemoteUrl, safeRemoteFetch } from '@/utils/safeRemoteFetch';
import { safeStringify } from '@/utils/safeStringify';
import {
  MAX_TOKEN_ICON_SIZE_BYTES,
  sanitizeTokenIcon,
} from '@/utils/tokenIconImage';

const MAX_REDIRECTS = 4;
const UPSTREAM_FETCH_TIMEOUT_MS = 5000;
const CACHE_CONTROL =
  'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800';

const sendImage = (
  res: NextApiResponse,
  image: Buffer,
  contentType: string,
) => {
  res.setHeader('Cache-Control', CACHE_CONTROL);
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
  res.setHeader('X-Content-Type-Options', 'nosniff');
  return res.status(200).send(image);
};

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

  const requiresPng = req.query.format === 'png';

  try {
    if (!(await isSafeRemoteUrl(iconUrl))) {
      return res.status(400).end();
    }
  } catch (error) {
    logger.error(
      `Failed to validate token icon URL: ${safeStringify({
        iconUrl: iconUrl.toString(),
        error,
      })}`,
    );
    return res.status(502).end();
  }

  try {
    const iconResponse = await safeRemoteFetch(iconUrl, {
      headers: {
        Accept: requiresPng
          ? 'image/png,image/jpeg,image/svg+xml,image/*;q=0.8'
          : 'image/avif,image/webp,image/png,image/jpeg,image/svg+xml,image/*',
      },
      maxRedirects: MAX_REDIRECTS,
      timeoutMs: UPSTREAM_FETCH_TIMEOUT_MS,
      maxResponseBytes: MAX_TOKEN_ICON_SIZE_BYTES,
    });

    if (!iconResponse.ok) {
      return res.status(404).end();
    }

    const contentType = iconResponse.headers.get('content-type') || '';
    const contentLength = Number(iconResponse.headers.get('content-length'));
    if (contentLength > MAX_TOKEN_ICON_SIZE_BYTES) {
      return res.status(413).end();
    }

    const icon = Buffer.from(await iconResponse.arrayBuffer());
    if (icon.byteLength > MAX_TOKEN_ICON_SIZE_BYTES) {
      return res.status(413).end();
    }

    try {
      const sanitizedIcon = await sanitizeTokenIcon(icon, contentType, {
        forcePng: requiresPng,
      });
      return sendImage(res, sanitizedIcon.image, sanitizedIcon.contentType);
    } catch (error) {
      logger.warn(
        `Failed to sanitize token icon: ${safeStringify({
          iconUrl: iconUrl.toString(),
          contentType,
          error,
        })}`,
      );
      return res.status(415).end();
    }
  } catch (error) {
    logger.error(
      `Failed to proxy token icon: ${safeStringify({
        iconUrl: iconUrl.toString(),
        error,
      })}`,
    );
    return res.status(502).end();
  }
}
