import type { Regions } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';
import { dayjs } from '@/utils/dayjs';

export default async function user(req: NextApiRequest, res: NextApiResponse) {
  const params = req.query;
  const category = params.category as string;
  const filter = params.filter as string;
  const region = params.region as string;
  const take = params.take ? parseInt(params.take as string, 10) : 10;
  const result: any = {
    bounties: [],
    grants: [],
    jobs: [],
  };
  const skillsFilter = filter
    ? {
        skills: {
          path: '$[*].skills',
          array_contains: filter.split(',')[0],
        },
      }
    : {};
  const skillsFilterJobs = filter
    ? { skills: { contains: filter.split(',')[0] } }
    : {};
  try {
    if (!category || category === 'all') {
      const bounties = await prisma.bounties.findMany({
        where: {
          isPublished: true,
          isActive: true,
          isArchived: false,
          status: 'OPEN',
          region: region.toUpperCase() as Regions,
          deadline: {
            gte: dayjs().toISOString(),
          },
          ...skillsFilter,
        },
        take,

        orderBy: {
          deadline: 'asc',
        },
        include: {
          sponsor: {
            select: {
              name: true,
              slug: true,
              logo: true,
            },
          },
        },
      });
      result.bounties = bounties;
    } else if (category === 'bounties') {
      const bounties = await prisma.bounties.findMany({
        where: {
          isPublished: true,
          isActive: true,
          isArchived: false,
          status: 'OPEN',
          region: region.toUpperCase() as Regions,
          deadline: {
            gte: dayjs().subtract(1, 'month').toISOString(),
          },
          ...skillsFilter,
        },
        take,
        orderBy: {
          deadline: 'desc',
        },
        include: {
          sponsor: {
            select: {
              name: true,
              slug: true,
              logo: true,
            },
          },
        },
      });
      const splitIndex = bounties.findIndex((bounty) =>
        dayjs().isAfter(dayjs(bounty?.deadline))
      );
      if (splitIndex >= 0) {
        const bountiesOpen = bounties.slice(0, splitIndex).reverse();
        const bountiesClosed = bounties.slice(splitIndex);
        result.bounties = [...bountiesOpen, ...bountiesClosed];
      } else {
        result.bounties = bounties;
      }
    }

    if (!category || category === 'all' || category === 'grants') {
      const grants = await prisma.grants.findMany({
        where: {
          isPublished: true,
          isActive: true,
          isArchived: false,
          ...skillsFilter,
        },
        take,
        orderBy: {
          updatedAt: 'desc',
        },
        select: {
          id: true,
          title: true,
          slug: true,
          shortDescription: true,
          token: true,
          rewardAmount: true,
          link: true,
          sponsor: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
            },
          },
        },
      });
      result.grants = grants;
    }

    if (!category || category === 'all' || category === 'jobs') {
      const jobs = await prisma.jobs.findMany({
        where: {
          private: false,
          active: true,
          ...skillsFilterJobs,
        },
        take,
        orderBy: {
          updatedAt: 'desc',
        },
        select: {
          id: true,
          title: true,
          slug: true,
          link: true,
          location: true,
          skills: true,
          sponsor: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
            },
          },
        },
      });
      result.jobs = jobs;
    }
    res.status(200).json(result);
  } catch (error) {
    console.log(error);

    res.status(400).json({
      error,
      message: 'Error occurred while fetching listings',
    });
  }
}
