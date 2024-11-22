import { Regions } from '@prisma/client';
import { type NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import {
  filterRegionCountry,
  getCombinedRegion,
  getStatusFilterQuery,
  type StatusFilter,
} from '@/features/listings';
import { prisma } from '@/prisma';

const TAKE = 20;

interface ForYouProps {
  userId: string;
  order?: 'asc' | 'desc';
  statusFilter?: StatusFilter;
}

export async function getForYouListings({ statusFilter, userId }: ForYouProps) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { skills: true, location: true, isTalentFilled: true },
  });

  if (!user?.isTalentFilled) return [];

  const subscribedListings = prisma.subscribeBounty.findMany({
    where: { userId },
    select: { bountyId: true },
  });

  const userSkills =
    (user?.skills as { skills: string }[] | null)?.map(
      (skill) => skill.skills,
    ) || [];

  const userRegion = user?.location
    ? getCombinedRegion(user?.location, true)
    : undefined;

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

  let listings = await prisma.bounties.findMany({
    where: {
      isPublished: true,
      isActive: true,
      isPrivate: false,
      hackathonprize: false,
      isArchived: false,
      language: { in: ['eng', 'sco'] },
      region: {
        in: userRegion?.name
          ? [
              Regions.GLOBAL,
              userRegion.name,
              ...(filterRegionCountry(userRegion, user.location || '')
                .country || []),
            ]
          : [Regions.GLOBAL],
      },
      AND: [
        {
          OR: [
            { compensationType: 'fixed', usdValue: { gt: 100 } },
            { compensationType: 'range', maxRewardAsk: { gt: 100 } },
            { compensationType: 'variable' },
          ],
        },
        {
          OR: [
            {
              id: { in: (await subscribedListings).map((sub) => sub.bountyId) },
            },
            ...userSkills.map((skill) => ({
              skills: {
                path: '$[*].skills',
                array_contains: [skill],
              },
            })),
          ],
        },
      ],
      ...statusFilterQuery,
      Hackathon: null,
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
              type: { not: 'SUBMISSION' },
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
    orderBy,
    take: TAKE,
  });

  if (statusFilter === 'open') {
    listings = listings.sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) {
        return -1;
      } else if (!a.isFeatured && b.isFeatured) {
        return 1;
      } else {
        return 0;
      }
    });
  }

  return listings;
}

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const params = req.query;
  const statusFilter = params.statusFilter as StatusFilter;

  const listings = await getForYouListings({ userId, statusFilter });

  res.status(200).json(listings);
}

export default withAuth(handler);
