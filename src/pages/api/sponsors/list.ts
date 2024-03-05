import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

import { prisma } from '@/prisma';

export default async function sponsors(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const params = req.query;

  const token = await getToken({ req });

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = token.id;

  if (!userId) {
    return res.status(400).json({ error: 'Invalid token' });
  }

  const searchString = params.searchString as string;
  const take = params.take ? parseInt(params.take as string, 10) : 50;
  let finalSponsors = [];
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
            Hackathon: null,
          }
        : {
            Hackathon: null,
          };
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
              Hackathon: null,
            },
          }
        : { sponsor: { Hackathon: null } };
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
