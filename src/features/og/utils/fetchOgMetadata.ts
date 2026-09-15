import { unfurl } from 'unfurl.js';

import logger from '@/lib/logger';
import { getCloudinaryFetchUrl } from '@/utils/cloudinary';
import { isSafeRemoteUrl, safeRemoteFetch } from '@/utils/safeRemoteFetch';
import { safeStringify } from '@/utils/safeStringify';

export type OgMetadata = NonNullable<
  Awaited<ReturnType<typeof unfurl>>['open_graph']
>;
export type OgMetadataResult = OgMetadata | 'error';

const OG_FETCH_HEADERS = {
  Accept: 'text/html, application/xhtml+xml',
  'User-Agent': 'facebookexternalhit',
};
const OG_FETCH_TIMEOUT_MS = 5000;
const OG_MAX_RESPONSE_BYTES = 1024 * 1024;

const normalizeUnfurlUrl = (url: string): string => {
  const trimmedUrl = url.trim();
  return /^https?:\/\//i.test(trimmedUrl)
    ? trimmedUrl
    : `https://${trimmedUrl}`;
};

export const fetchOgMetadata = async (
  sourceUrl: string,
): Promise<OgMetadataResult> => {
  const unfurlUrl = normalizeUnfurlUrl(sourceUrl);

  try {
    const parsedUrl = new URL(unfurlUrl);
    if (!(await isSafeRemoteUrl(parsedUrl))) {
      logger.warn(`Blocked unsafe OG URL: ${unfurlUrl}`);
      return 'error';
    }

    logger.debug(`Unfurling URL: ${unfurlUrl}`);
    const metadata = await Promise.race([
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
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), OG_FETCH_TIMEOUT_MS),
      ),
    ]);

    const openGraph = metadata.open_graph;
    if (!openGraph?.images?.[0]?.url) {
      logger.warn(`No OG image found for URL: ${unfurlUrl}`);
      return 'error';
    }

    openGraph.images[0].url =
      getCloudinaryFetchUrl(openGraph.images[0].url) || openGraph.images[0].url;

    logger.info(`Successfully unfurled URL: ${unfurlUrl}`);
    return openGraph;
  } catch (error) {
    logger.warn(`Error unfurling URL: ${unfurlUrl}`, safeStringify(error));
    return 'error';
  }
};
