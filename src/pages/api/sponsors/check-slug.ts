import type { NextApiRequest, NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { publicApiRateLimiter } from '@/lib/ratelimit';
import { checkAndApplyRateLimit } from '@/lib/rateLimiterService';
import { prisma } from '@/prisma';
import { getClientIPPages } from '@/utils/getClientIPPages';
import { safeStringify } from '@/utils/safeStringify';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const clientIP = getClientIPPages(req);
  const canProceed = await checkAndApplyRateLimit(res, {
    limiter: publicApiRateLimiter,
    identifier: `sponsors_check_slug:${clientIP}`,
    routeName: 'sponsors-check-slug',
  });
  if (!canProceed) return;

  logger.info(`Request query: ${safeStringify(req.query)}`);

  if (req.method !== 'GET') {
    logger.warn(`Method not allowed: ${req.method}`);
    return res.status(405).end('Method Not Allowed');
  }

  const { slug } = req.query;

  if (!slug || typeof slug !== 'string') {
    logger.warn('Invalid slug parameter');
    return res
      .status(400)
      .json({ error: 'slug is required and must be a string.' });
  }

  try {
    logger.debug(`Checking availability for slug: ${slug}`);
    const sponsor = await prisma.sponsors.findUnique({
      where: { slug },
    });

    if (sponsor) {
      logger.info(`slug ${slug} is not available`);
      return res.status(200).json({ available: false });
    }

    logger.info(`slug ${slug} is available`);
    return res.status(200).json({ available: true });
  } catch (error: any) {
    logger.error(
      `Error occurred while checking slug availability: ${safeStringify(error)}`,
    );
    return res.status(500).json({
      error: 'Error occurred while checking the slug availability.',
    });
  }
}
