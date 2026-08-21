import type { NextApiResponse } from 'next';

import { prisma } from '@/prisma';
import { parseBoundedIntegerParam } from '@/utils/apiPagination';

import { type NextApiRequestWithUser } from '@/features/auth/types';
import { withAuth } from '@/features/auth/utils/withAuth';

async function hackathons(req: NextApiRequestWithUser, res: NextApiResponse) {
  const params = req.query;

  const userId = req.userId;

  const searchString = params.searchString as string;
  const takeResult = parseBoundedIntegerParam(params.take, {
    defaultValue: 30,
    maxValue: 100,
    minValue: 1,
    name: 'take',
  });
  if (!takeResult.ok) {
    return res.status(400).json({ error: takeResult.error });
  }
  const take = takeResult.value;
  let finalHackathons = [];
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId as string,
      },
      select: {
        id: true,
        role: true,
      },
    });
    if (user && user?.role === 'GOD') {
      const whereSearch = searchString
        ? {
            name: {
              contains: searchString,
            },
          }
        : {};
      const hackathonsList = await prisma.hackathon.findMany({
        where: {
          ...whereSearch,
        },
        take,
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
          altLogo: true,
        },
        orderBy: {
          slug: 'asc',
        },
      });
      finalHackathons = hackathonsList.map((hackathon) => {
        return {
          value: hackathon.id,
          label: hackathon.name,
          hackathon: {
            ...hackathon,
            role: 'GOD MODE',
          },
        };
      });
    } else {
      const whereSearch = searchString
        ? {
            name: {
              contains: searchString,
            },
          }
        : {};
      const hackathonsList = await prisma.hackathon.findMany({
        where: {
          ...whereSearch,
        },
        orderBy: {
          announceDate: 'desc',
        },
        take,
      });
      finalHackathons = hackathonsList.map((hackathon) => {
        return {
          value: hackathon.id,
          label: hackathon.name,
          hackathon: {
            ...hackathon,
            role: 'GOD MODE',
          },
        };
      });
    }
    res.status(200).json(finalHackathons);
  } catch (error) {
    res.status(400).json({
      error,
      message: 'Error occurred while fetching hackathons',
    });
  }
}

export default withAuth(hackathons);
