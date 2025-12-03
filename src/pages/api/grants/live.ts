import type { NextApiRequest, NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { publicApiRateLimiter } from '@/lib/ratelimit';
import { checkAndApplyRateLimit } from '@/lib/rateLimiterService';
import { prisma } from '@/prisma';
import { getClientIPPages } from '@/utils/getClientIPPages';
import { safeStringify } from '@/utils/safeStringify';

import { getPrivyToken } from '@/features/auth/utils/getPrivyToken';
import { grantsSelect } from '@/features/grants/constants/schema';
import {
  filterRegionCountry,
  getCombinedRegion,
  getParentRegions,
} from '@/features/listings/utils/region';

export default async function grants(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const clientIP = getClientIPPages(req);
  const canProceed = await checkAndApplyRateLimit(res, {
    limiter: publicApiRateLimiter,
    identifier: `grants_live:${clientIP}`,
    routeName: 'grants-live',
  });
  if (!canProceed) return;

  try {
    logger.debug('Fetching grants from database');

    const params = req.query;
    const take = params.take ? parseInt(params.take as string, 10) : 100;
    let excludeIds = params['excludeIds[]'];
    if (typeof excludeIds === 'string') {
      excludeIds = [excludeIds];
    }

    const privyDid = await getPrivyToken(req);
    let userRegion: string[] | null | undefined = null;
    if (privyDid) {
      const user = await prisma.user.findFirst({
        where: { privyDid },
        select: { location: true },
      });

      const matchedRegion = user?.location
        ? getCombinedRegion(user?.location, true)
        : undefined;

      if (matchedRegion?.name) {
        userRegion = [
          matchedRegion.name,
          'Global',
          ...(filterRegionCountry(matchedRegion, user?.location || '')
            .country || []),
          ...(getParentRegions(matchedRegion) || []),
        ];
      } else {
        userRegion = ['Global'];
      }
    }

    const grants = await prisma.grants.findMany({
      where: {
        isPublished: true,
        isActive: true,
        isArchived: false,
        isPrivate: false,
        id: { notIn: excludeIds },
        ...(userRegion ? { region: { in: userRegion } } : {}),
      },
      take,
      orderBy: { createdAt: 'desc' },
      select: grantsSelect,
    });

    const grantsWithTotalApplications = grants.map((grant) => ({
      ...grant,
      totalApplications:
        grant._count.GrantApplication + grant.historicalApplications,
    }));

    logger.info(`Fetched ${grants.length} grants successfully`);
    return res.status(200).json(grantsWithTotalApplications);
  } catch (error: any) {
    logger.error(
      `Error occurred while fetching grants: ${safeStringify(error)}`,
    );
    return res
      .status(400)
      .json({ err: 'Error occurred while fetching grants.' });
  }
}
