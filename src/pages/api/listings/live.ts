import type { NextApiRequest, NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { type EnumBountyTypeFilter } from '@/prisma/commonInputTypes';
import { type BountyType } from '@/prisma/enums';
import { type BountiesFindManyArgs } from '@/prisma/models/Bounties';
import { setCacheHeaders } from '@/utils/cacheControl';

import { getPrivyToken } from '@/features/auth/utils/getPrivyToken';
import { listingSelect } from '@/features/listings/constants/schema';
import {
  filterRegionCountry,
  getCombinedRegion,
  getParentRegions,
} from '@/features/listings/utils/region';

export default async function listings(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const params = req.query;

  const type = params.type as EnumBountyTypeFilter | BountyType | undefined;
  const take = params.take ? parseInt(params.take as string, 10) : 10;
  const deadline = params.deadline as string;
  const exclusiveSponsorId = params.exclusiveSponsorId as string | undefined;
  let excludeIds = params['excludeIds[]'];
  if (typeof excludeIds === 'string') {
    excludeIds = [excludeIds];
  }

  const privyDid = await getPrivyToken(req);
  let userRegion;
  let userLocation;
  if (privyDid) {
    const user = await prisma.user.findFirst({
      where: { privyDid },
      select: { location: true },
    });
    userRegion = user?.location
      ? getCombinedRegion(user?.location, true)
      : undefined;
    userLocation = user?.location;
  }

  const listingQueryOptions: BountiesFindManyArgs = {
    where: {
      id: {
        notIn: excludeIds,
      },
      isPublished: true,
      isActive: true,
      isPrivate: false,
      isArchived: false,
      status: 'OPEN',
      deadline: { gte: deadline },
      type: type || { in: ['bounty', 'project'] },
      region: {
        in: userRegion?.name
          ? [
              'Global',
              userRegion.name,
              ...(filterRegionCountry(userRegion, userLocation || '').country ||
                []),
              ...(getParentRegions(userRegion) || []),
            ]
          : ['Global'],
      },
      sponsorId: exclusiveSponsorId,
    },
    select: listingSelect,
    take,
    orderBy: [{ deadline: 'asc' }, { winnersAnnouncedAt: 'desc' }],
  };

  try {
    const listings = await prisma.bounties.findMany(listingQueryOptions);

    // Apply conditional caching: only cache for unauthenticated users
    if (!privyDid) {
      setCacheHeaders(res, {
        public: true,
        maxAge: 5 * 60, // 5 minutes for authenticated users
        sMaxAge: 5 * 60,
        staleWhileRevalidate: 60, // 1 minute
      });
    }

    res.status(200).json(listings);
  } catch (error) {
    logger.error(error);

    res.status(400).json({
      error,
      message: 'Error occurred while fetching listings',
    });
  }
}
