import { type NextRequest, NextResponse } from 'next/server';
import { unfurl } from 'unfurl.js';

import logger from '@/lib/logger';
import { getCloudinaryFetchUrl } from '@/utils/cloudinary';
import { safeStringify } from '@/utils/safeStringify';

type UnfurlResult = Awaited<ReturnType<typeof unfurl>>;

const normalizeUnfurlUrl = (url: string): string => {
  const trimmedUrl = url.trim();

  if (/^https?:\/\//i.test(trimmedUrl)) return trimmedUrl;

  return `https://${trimmedUrl}`;
};

export async function GET(request: NextRequest) {
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
    logger.debug(`Unfurling URL: ${unfurlUrl}`);
    const metadata = await Promise.race<UnfurlResult>([
      unfurl(unfurlUrl),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 5000),
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
