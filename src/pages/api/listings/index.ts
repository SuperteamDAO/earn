import { type BountyType, type Prisma, Regions } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

import { filterRegionCountry, getCombinedRegion } from '@/features/listings';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { dayjs } from '@/utils/dayjs';

interface Listing {
  id?: string;
  winnersAnnouncedAt?: Date | null;
  deadline: Date | null;
  isFeatured: boolean;
}

function sortListings(listings: Listing[]): Listing[] {
  const today = new Date();

  return listings.sort((a, b) => {
    const deadlineA = a.deadline;
    const deadlineB = b.deadline;

    if (deadlineA && deadlineA > today && deadlineB && deadlineB > today) {
      // Sort by isFeatured descending if deadline is greater than today
      if (b.isFeatured !== a.isFeatured) {
        return b.isFeatured ? 1 : -1;
      }

      // Sort by deadline ascending (earliest deadline first) if isFeatured is the same
      return deadlineA.getTime() - deadlineB.getTime();
    }

    if (deadlineA && deadlineA <= today && deadlineB && deadlineB <= today) {
      // Sort by deadline descending if deadline is less than or equal to today
      if (deadlineA.getTime() !== deadlineB.getTime()) {
        return deadlineB.getTime() - deadlineA.getTime();
      }

      // Sort by winnersAnnouncedAt if deadline is less than or equal to today and winnersAnnouncedAt exists
      const winnersAnnouncedAtA = a.winnersAnnouncedAt;
      const winnersAnnouncedAtB = b.winnersAnnouncedAt;
      if (winnersAnnouncedAtA && winnersAnnouncedAtB) {
        return winnersAnnouncedAtB.getTime() - winnersAnnouncedAtA.getTime();
      } else if (winnersAnnouncedAtA && !winnersAnnouncedAtB) {
        return -1;
      } else if (!winnersAnnouncedAtA && winnersAnnouncedAtB) {
        return 1;
      }
    }

    // Sort listings with earlier deadlines or null deadlines first
    if (deadlineA === null && deadlineB !== null) {
      return 1;
    } else if (deadlineA !== null && deadlineB === null) {
      return -1;
    }

    return 0;
  });
}

export default async function listings(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const params = req.query;
  const order = (params.order as 'asc' | 'desc') ?? 'desc';

  const filter = params.filter as string;
  const type = params.type as
    | Prisma.EnumBountyTypeFilter
    | BountyType
    | undefined;
  const take = params.take ? parseInt(params.take as string, 10) : 10;
  const deadline = params.deadline as string;
  const exclusiveSponsorId = params.exclusiveSponsorId as string | undefined;
  let excludeIds = params['excludeIds[]'];
  if (typeof excludeIds === 'string') {
    excludeIds = [excludeIds];
  }

  const id = params.id as string;

  const filterToSkillsMap: Record<string, string[]> = {
    development: ['Frontend', 'Backend', 'Blockchain', 'Mobile'],
    design: ['Design'],
    content: ['Content'],
    other: ['Other', 'Growth', 'Community'],
  };

  const skillsToFilter = filterToSkillsMap[filter] || [];

  let skillsFilter = {};
  if (skillsToFilter.length > 0) {
    if (filter === 'development' || filter === 'other') {
      skillsFilter = {
        OR: skillsToFilter.map((skill) => ({
          skills: {
            path: '$[*].skills',
            array_contains: [skill],
          },
        })),
      };
    } else {
      skillsFilter = {
        skills: {
          path: '$[*].skills',
          array_contains: skillsToFilter,
        },
      };
    }
  }

  const token = await getToken({ req });
  const userId = token?.sub;
  let userRegion;
  let userLocation;
  if (userId) {
    const user = await prisma.user.findFirst({
      where: { id: userId },
      select: { location: true },
    });
    userRegion = user?.location
      ? getCombinedRegion(user?.location, true)
      : undefined;
    userLocation = user?.location;
  }

  const listingQueryOptions: Prisma.BountiesFindManyArgs = {
    where: {
      id: {
        notIn: excludeIds,
      },
      isPublished: true,
      isActive: true,
      isPrivate: false,
      isArchived: false,
      status: 'OPEN',
      deadline: {
        gte: deadline,
      },
      type: type || { in: ['bounty', 'project'] },
      ...skillsFilter,
      NOT: { id },
      region: {
        in: userRegion?.name
          ? [
              Regions.GLOBAL,
              userRegion.name,
              ...(filterRegionCountry(userRegion, userLocation || '').country ||
                []),
            ]
          : [Regions.GLOBAL],
      },
      ...(exclusiveSponsorId ? { sponsorId: exclusiveSponsorId } : {}),
    },
    select: {
      rewardAmount: true,
      deadline: true,
      type: true,
      title: true,
      token: true,
      winnersAnnouncedAt: true,
      slug: true,
      isWinnersAnnounced: true,
      isFeatured: true,
      compensationType: true,
      minRewardAsk: true,
      maxRewardAsk: true,
      status: true,
      _count: {
        select: {
          Comments: {
            where: {
              isActive: true,
              isArchived: false,
              replyToId: null,
              type: {
                not: 'SUBMISSION',
              },
            },
          },
        },
      },
      sponsor: {
        select: {
          name: true,
          slug: true,
          logo: true,
          isVerified: true,
        },
      },
    },
    take,
    orderBy: [
      {
        deadline: order,
      },
      {
        winnersAnnouncedAt: 'desc',
      },
    ],
  };

  try {
    let result;
    const listings = await prisma.bounties.findMany(listingQueryOptions);

    const splitIndex = listings.findIndex((listing) =>
      dayjs().isAfter(dayjs(listing?.deadline)),
    );
    if (splitIndex >= 0) {
      const listingsOpen = listings.slice(0, splitIndex).reverse();
      const listingsClosed = listings.slice(splitIndex);

      result = [...listingsOpen, ...listingsClosed];
    } else {
      result = listings.slice(0, take);
    }
    result = sortListings(listings);

    res.status(200).json(result);
  } catch (error) {
    logger.error(error);

    res.status(400).json({
      error,
      message: 'Error occurred while fetching listings',
    });
  }
}
