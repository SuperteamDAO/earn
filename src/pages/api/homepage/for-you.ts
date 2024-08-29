import { Regions } from '@prisma/client';
import { type NextApiResponse } from 'next';

import { CombinedRegions } from '@/constants/Superteam';
import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import { getStatusFilterQuery, type StatusFilter } from '@/features/listings';
import { prisma } from '@/prisma';

const TAKE = 20;

interface ForYouProps {
  userId: string;
  statusFilter?: StatusFilter;
}

export async function getForYouListings({ statusFilter, userId }: ForYouProps) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { skills: true, location: true },
  });

  const subscribedListings = prisma.subscribeBounty.findMany({
    where: { userId },
    select: { bountyId: true },
  });

  const userSkills =
    (user?.skills as { skills: string }[] | null)?.map(
      (skill) => skill.skills,
    ) || [];

  const userRegion = await getUserRegion(user?.location || null);

  const statusFilterQuery = getStatusFilterQuery(statusFilter);

  const listings = await prisma.bounties.findMany({
    where: {
      isPublished: true,
      isActive: true,
      isPrivate: false,
      hackathonprize: false,
      isArchived: false,
      language: { in: ['eng', 'sco'] },
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
            { region: { equals: userRegion } },
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
      applicationType: true,
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
    orderBy: [{ isFeatured: 'desc' }, { deadline: 'asc' }],
    take: TAKE,
  });

  return listings;
}

async function getUserRegion(location: string | null) {
  if (!location) return Regions.GLOBAL;

  const matchedRegion = CombinedRegions.find((region) =>
    region.country.includes(location),
  );

  return matchedRegion?.region;
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
