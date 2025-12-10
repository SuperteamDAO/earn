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
    identifier: `sponsors_check_name:${clientIP}`,
    routeName: 'sponsors-check-name',
  });
  if (!canProceed) return;

  logger.info(`Request query: ${safeStringify(req.query)}`);

  if (req.method !== 'GET') {
    logger.warn(`Method not allowed: ${req.method}`);
    return res.status(405).end('Method Not Allowed');
  }

  const { name } = req.query;

  if (!name || typeof name !== 'string') {
    logger.warn('Invalid name parameter');
    return res
      .status(400)
      .json({ error: 'name is required and must be a string.' });
  }

  try {
    logger.debug(`Checking availability for name: ${name}`);
    const sponsor = await prisma.sponsors.findUnique({
      where: { name },
    });

    if (sponsor) {
      logger.info(`name ${name} is not available`);
      return res.status(200).json({ available: false });
    }

    logger.info(`name ${name} is available`);
    return res.status(200).json({ available: true });
  } catch (error: any) {
    logger.error(
      `Error occurred while checking name availability: ${safeStringify(error)}`,
    );
    return res.status(500).json({
      error: 'Error occurred while checking the name availability.',
    });
  }
}
