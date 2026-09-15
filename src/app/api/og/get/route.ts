import { type NextRequest, NextResponse } from 'next/server';

import logger from '@/lib/logger';
import { ogMetadataRateLimiter } from '@/lib/ratelimit';
import { checkAndApplyRateLimitApp } from '@/lib/rateLimiterService';
import { safeStringify } from '@/utils/safeStringify';

import { fetchOgMetadata } from '@/features/og/utils/fetchOgMetadata';

const getRequestIp = (request: NextRequest): string => {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || forwarded;

  return (
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    'unknown'
  );
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

  const result = await fetchOgMetadata(url);
  return NextResponse.json({ result }, { status: 200 });
}
