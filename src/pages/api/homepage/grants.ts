import { Regions } from '@prisma/client';
import { type NextApiRequest, type NextApiResponse } from 'next';

import { CombinedRegions } from '@/constants/Superteam';
import { prisma } from '@/prisma';

import { getPrivyToken } from '@/features/auth/utils/getPrivyToken';
import { getParentRegions } from '@/features/listings/utils/region';

const TAKE = 20;

interface GrantProps {
  userRegion?: string[] | null;
}

async function getGrants({ userRegion }: GrantProps) {
  return await prisma.grants.findMany({
    where: {
      isPublished: true,
      isActive: true,
      isArchived: false,
      isPrivate: false,
      ...(userRegion ? { region: { in: userRegion } } : {}),
    },
    take: TAKE,
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      slug: true,
      title: true,
      minReward: true,
      maxReward: true,
      token: true,
      totalApproved: true,
      historicalApplications: true,
      sponsor: {
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
          isVerified: true,
        },
      },
      _count: {
        select: {
          GrantApplication: {
            where: {
              OR: [
                {
                  applicationStatus: 'Approved',
                },
                {
                  applicationStatus: 'Completed',
                },
              ],
            },
          },
        },
      },
    },
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const privyDid = await getPrivyToken(req);

  let userRegion: string[] | null = null;

  if (privyDid) {
    const user = await prisma.user.findUnique({
      where: { privyDid },
    });

    if (user) {
      const matchedGrantsRegion = CombinedRegions.find((region) =>
        region.country.includes(user.location!),
      );

      if (matchedGrantsRegion?.region) {
        userRegion = [
          matchedGrantsRegion.region,
          Regions.GLOBAL,
          ...(matchedGrantsRegion.country || []),
          ...(getParentRegions(matchedGrantsRegion) || []),
        ];
      } else {
        userRegion = [Regions.GLOBAL];
      }
    }
  }

  const grants = await getGrants({ userRegion });

  const grantsWithTotalApplications = grants.map((grant) => ({
    ...grant,
    totalApplications:
      grant._count.GrantApplication + grant.historicalApplications,
  }));

  res.status(200).json(grantsWithTotalApplications);
}
