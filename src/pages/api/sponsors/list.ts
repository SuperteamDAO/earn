import type { NextApiResponse } from 'next';

import {
  type NextApiRequestWithSponsor,
  withSponsorAuth,
} from '@/features/auth';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';

async function sponsors(req: NextApiRequestWithSponsor, res: NextApiResponse) {
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

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'GOD') {
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
          isVerified: true,
        },
        orderBy: {
          slug: 'asc',
        },
      });

      finalSponsors = sponsorsList.map((sponsor) => ({
        value: sponsor.id,
        label: sponsor.name,
        sponsor: {
          ...sponsor,
          role: 'GOD MODE',
        },
      }));
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
              isVerified: true,
            },
          },
        },
        take,
      });

      finalSponsors = sponsorsList.map((sponsor) => ({
        value: sponsor.sponsor.id,
        label: sponsor.sponsor.name,
        sponsor: {
          ...sponsor.sponsor,
          role: sponsor.role,
        },
      }));
    }

    res.status(200).json(finalSponsors);
  } catch (error: any) {
    logger.error(
      `Error fetching sponsors for user ${userId}: ${error.message}`,
    );
    res.status(500).json({
      error: error.message || 'Internal server error',
      message: 'Error occurred while fetching sponsors',
    });
  }
}

export default withSponsorAuth(sponsors);
