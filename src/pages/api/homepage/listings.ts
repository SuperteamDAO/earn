import { type Regions } from '@prisma/client';
import { type NextApiRequest, type NextApiResponse } from 'next';

import { getStatusFilterQuery, type StatusFilter } from '@/features/listings';
import { prisma } from '@/prisma';

const TAKE = 20;

interface BountyProps {
  order?: 'asc' | 'desc';
  statusFilter?: StatusFilter;
  userRegion?: string[] | null;
  excludeIds?: string[];
  tab?: string;
}

export async function getListings({
  statusFilter,
  userRegion,
  excludeIds,
  tab,
}: BountyProps) {
  const statusFilterQuery = getStatusFilterQuery(statusFilter);
  let orderBy:
    | { deadline: 'asc' | 'desc' }
    | { winnersAnnouncedAt: 'asc' | 'desc' }
    | [{ isFeatured: 'desc' }, { deadline: 'asc' | 'desc' }] = {
    deadline: 'desc',
  };
  if (statusFilter === 'open') {
    orderBy = [
      {
        isFeatured: 'desc',
      },
      {
        deadline: 'asc',
      },
    ];
  } else if (statusFilter === 'completed') {
    orderBy = {
      winnersAnnouncedAt: 'desc',
    };
  }

  const isTabOpen = tab === 'open';
  
  let bounties = await prisma.bounties.findMany({
    where: {
      id: {
        notIn: excludeIds,
      },
      isPublished: true,
      isActive: true,
      isPrivate: false,
      isArchived: false,
      // Only filter out hackathon prizes when not in tab=open mode
      ...(!isTabOpen ? { hackathonprize: false } : {}),
      // When tab=open, use the same filtering as /api/listings
      ...(isTabOpen ? {
        // No compensation filter
        // No language filter
        // Note: /api/listings doesn't filter by hackathonprize or Hackathon
      } : {
        OR: [
          { compensationType: 'fixed', usdValue: { gt: 100 } },
          { compensationType: 'range', maxRewardAsk: { gt: 100 } },
          { compensationType: 'variable' },
        ],
        language: { in: ['eng', 'sco'] }, //cuz both eng and sco refer to listings in english
      }),
      ...statusFilterQuery,
      // Only apply region filter when not in tab=open mode
      ...(!isTabOpen && userRegion ? { region: { in: userRegion } } : {}),
      // Only exclude hackathons when not in tab=open mode
      ...(!isTabOpen ? { Hackathon: null } : {}),
    },
    select: {
      id: true,
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
          st: true,
        },
      },
    },
    orderBy,
    take: TAKE,
  });

  if (statusFilter === 'open') {
    bounties = bounties.sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) {
        return -1;
      } else if (!a.isFeatured && b.isFeatured) {
        return 1;
      } else {
        return 0;
      }
    });
  }
  return bounties;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const params = req.query;
  const order = (params.order as 'asc' | 'desc') ?? 'desc';
  const statusFilter = params.statusFilter as StatusFilter;
  const tab = params.tab as string;
  let userRegion = params['userRegion[]'] as Regions[];
  if (typeof userRegion === 'string') {
    userRegion = [userRegion];
  }
  let excludeIds = params['excludeIds[]'];
  if (typeof excludeIds === 'string') {
    excludeIds = [excludeIds];
  }

  const listings = await getListings({
    order,
    statusFilter,
    userRegion,
    excludeIds,
    tab,
  });

  res.status(200).json(listings);
}
