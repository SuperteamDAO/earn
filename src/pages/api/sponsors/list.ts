import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import { prisma } from '@/prisma';

async function sponsors(req: NextApiRequestWithUser, res: NextApiResponse) {
  const params = req.query;

  const userId = req.userId;

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

export default withAuth(sponsors);
