import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/prisma';

export default async function sponsors(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const params = req.query;
  const userId = params.userId as string;
  const searchString = params.searchString as string;
  const take = params.take ? parseInt(params.take as string, 10) : 10;
  let finalSponsors = [];
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
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
      const sponsorsList = await prisma.sponsors.findMany({
        where: {
          ...whereSearch,
        },
        take,
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
        },
        orderBy: {
          slug: 'asc',
        },
      });
      finalSponsors = sponsorsList.map((sponsor) => {
        return {
          value: sponsor.id,
          label: sponsor.name,
          sponsor: {
            ...sponsor,
            role: 'GOD MODE',
          },
        };
      });
    } else {
      const whereSearch = searchString
        ? {
            sponsor: {
              name: {
                contains: searchString,
              },
            },
          }
        : {};
      const sponsorsList = await prisma.userSponsors.findMany({
        where: {
          userId,
          ...whereSearch,
        },
        orderBy: {
          sponsor: {
            slug: 'asc',
          },
        },
        include: {
          sponsor: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
            },
          },
        },
        take,
      });
      finalSponsors = sponsorsList.map((sponsor) => {
        return {
          value: sponsor.sponsor.id,
          label: sponsor.sponsor.name,
          sponsor: {
            ...sponsor.sponsor,
            role: sponsor.role,
          },
        };
      });
    }
    res.status(200).json(finalSponsors);
  } catch (error) {
    res.status(400).json({
      error,
      message: 'Error occurred while fetching sponsors',
    });
  }
}
