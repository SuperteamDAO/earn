import { type Regions } from '@prisma/client';
import { type NextApiRequest, type NextApiResponse } from 'next';

import { prisma } from '@/prisma';

const TAKE = 20;

interface GrantProps {
  userRegion?: Regions[] | null;
}

async function getGrants({ userRegion }: GrantProps) {
  return await prisma.grants.findMany({
    where: {
      isPublished: true,
      isActive: true,
      isArchived: false,
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
              applicationStatus: 'Approved',
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
  const params = req.query;
  let userRegion = params['userRegion[]'] as Regions[];
  if (typeof userRegion === 'string') {
    userRegion = [userRegion];
  }

  const grants = await getGrants({ userRegion });

  const grantsWithTotalApplications = grants.map((grant) => ({
    ...grant,
    totalApplications:
      grant._count.GrantApplication + grant.historicalApplications,
  }));

  res.status(200).json(grantsWithTotalApplications);
}
