import { type NextRequest, NextResponse } from 'next/server';
import { unfurl } from 'unfurl.js';

import logger from '@/lib/logger';
import { ogMetadataRateLimiter } from '@/lib/ratelimit';
import { checkAndApplyRateLimitApp } from '@/lib/rateLimiterService';
import { getCloudinaryFetchUrl } from '@/utils/cloudinary';
import { isSafeRemoteUrl, safeRemoteFetch } from '@/utils/safeRemoteFetch';
import { safeStringify } from '@/utils/safeStringify';

type UnfurlResult = Awaited<ReturnType<typeof unfurl>>;

const OG_FETCH_HEADERS = {
  Accept: 'text/html, application/xhtml+xml',
  'User-Agent': 'facebookexternalhit',
};
const OG_FETCH_TIMEOUT_MS = 5000;
const OG_MAX_RESPONSE_BYTES = 1024 * 1024;

const getRequestIp = (request: NextRequest): string => {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || forwarded;

  return (
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    'unknown'
  );
};

const normalizeUnfurlUrl = (url: string): string => {
  const trimmedUrl = url.trim();

  if (/^https?:\/\//i.test(trimmedUrl)) return trimmedUrl;

  return `https://${trimmedUrl}`;
};

export async function GET(request: NextRequest) {
  const rateLimitResponse = await checkAndApplyRateLimitApp({
    limiter: ogMetadataRateLimiter,
    identifier: getRequestIp(request),
    routeName: 'og_metadata',
  });
  if (rateLimitResponse) return rateLimitResponse;

  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  logger.debug(`Request query: ${safeStringify({ url })}`);

  if (!url || typeof url !== 'string') {
    logger.warn('URL is required and must be a string');
    return NextResponse.json(
      { error: 'URL is required and must be a string.' },
      { status: 400 },
    );
  }

  const unfurlUrl = normalizeUnfurlUrl(url);

  try {
    const parsedUrl = new URL(unfurlUrl);
    if (!(await isSafeRemoteUrl(parsedUrl))) {
      logger.warn(`Blocked unsafe OG URL: ${unfurlUrl}`);
      return NextResponse.json({ result: 'error' }, { status: 200 });
    }

    logger.debug(`Unfurling URL: ${unfurlUrl}`);
    const metadata = await Promise.race<UnfurlResult>([
      unfurl(unfurlUrl, {
        oembed: false,
        follow: 0,
        timeout: OG_FETCH_TIMEOUT_MS,
        size: OG_MAX_RESPONSE_BYTES,
        headers: OG_FETCH_HEADERS,
        fetch: (targetUrl: string) =>
          safeRemoteFetch(targetUrl, {
            headers: OG_FETCH_HEADERS,
            timeoutMs: OG_FETCH_TIMEOUT_MS,
            maxResponseBytes: OG_MAX_RESPONSE_BYTES,
          }),
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), OG_FETCH_TIMEOUT_MS),
      ),
    ]);

    if (!metadata.open_graph?.images?.[0]?.url) {
      logger.warn(`No OG image found for URL: ${unfurlUrl}`);
      return NextResponse.json({ result: 'error' });
    }

    if (metadata.open_graph?.images?.[0]?.url) {
      metadata.open_graph.images[0].url =
        getCloudinaryFetchUrl(metadata.open_graph.images[0].url) ||
        metadata.open_graph.images[0].url;
    }

    logger.info(`Successfully unfurled URL: ${unfurlUrl}`);
    return NextResponse.json({ result: metadata.open_graph });
  } catch (error: any) {
    logger.warn(`Error unfurling URL: ${unfurlUrl}`, safeStringify(error));
    return NextResponse.json({ result: 'error' }, { status: 200 });
  }
}
